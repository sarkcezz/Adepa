import { NextResponse, after } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { porkEvents, eventRegistrations } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { resolveCheckoutUser } from "@/app/api/_lib/auth";
import { notifyUser } from "@/app/api/_lib/notifications";
import { sendEventConfirmationEmail } from "@/app/api/_lib/event-email";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L — easy to read back over the phone
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

const ALREADY_REGISTERED = "This phone number is already registered for this event. Use your booking code to view or change it.";

/** POST /events/:id/register — book a spot, signed in or as a guest. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limit = rateLimit(`event-register:${clientIp(req)}`, 5, 15 * 60_000);
  if (!limit.allowed) return fail(`Too many booking attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const { id } = await params;
  const b = await body<{
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    companions?: string[];
  }>(req);

  const [event] = await db.select().from(porkEvents).where(eq(porkEvents.id, id)).limit(1);
  if (!event || event.status !== "PUBLISHED") return fail("Event not found.", 404);

  const companions = Array.isArray(b.companions)
    ? b.companions.map((c) => String(c).trim()).filter(Boolean).slice(0, 20)
    : [];
  const partySize = 1 + companions.length;

  // Reserve the seats atomically first — the WHERE clause is checked and
  // written in one statement, so two concurrent requests can't both pass a
  // separate "is there room" read and jointly oversell the event.
  const [reserved] = await db
    .update(porkEvents)
    .set({ registered_count: sql`${porkEvents.registered_count} + ${partySize}` })
    .where(and(eq(porkEvents.id, id), sql`${porkEvents.registered_count} + ${partySize} <= ${porkEvents.capacity}`))
    .returning();
  if (!reserved) {
    const spotsLeft = event.capacity - event.registered_count;
    return fail(spotsLeft <= 0 ? "This event is sold out." : `Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left — try a smaller party.`, 422);
  }

  async function releaseReservation() {
    await db
      .update(porkEvents)
      .set({ registered_count: sql`GREATEST(${porkEvents.registered_count} - ${partySize}, 0)` })
      .where(eq(porkEvents.id, id));
  }

  const user = await resolveCheckoutUser(req, { name: b.guest_name, phone: b.guest_phone, email: b.guest_email });
  if (user instanceof NextResponse) {
    await releaseReservation();
    return user;
  }

  const [existing] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.event_id, id), eq(eventRegistrations.customer_id, user.id)))
    .limit(1);
  if (existing) {
    await releaseReservation();
    return fail(ALREADY_REGISTERED, 422);
  }

  // Free events need no payment; paid events settle in cash at the event door (online payment isn't set up yet).
  const paid = event.flat_rate_kobo === 0;

  let registration;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        [registration] = await db
          .insert(eventRegistrations)
          .values({
            event_id: id,
            customer_id: user.id,
            payment_status: paid ? "PAID" : "PENDING",
            companions,
            management_code: generateCode(),
          })
          .returning();
        break;
      } catch (e) {
        const pgError = e && typeof e === "object" ? (e as { code?: unknown; constraint?: unknown }) : {};
        if (pgError.code !== "23505") throw e;
        if (pgError.constraint === "event_reg_unique") {
          // A concurrent request for the same event+customer won the race — not a code collision.
          await releaseReservation();
          return fail(ALREADY_REGISTERED, 422);
        }
        if (attempt === 4) throw e; // management_code collision, retries exhausted
        // otherwise: management_code collision — regenerate and retry
      }
    }
  } catch (e) {
    await releaseReservation();
    throw e;
  }
  if (!registration) {
    await releaseReservation();
    return fail("Could not complete your booking. Please try again.", 500);
  }

  // SMS/in-app notification is fire-and-forget, matching the rest of the app.
  waitUntil(
    notifyUser(user.id, {
      type: "event.registered",
      title: `You're booked for ${event.name}`,
      message: `Party of ${partySize}. Booking code: ${registration.management_code}.`,
      sms: true,
    }),
  );
  // Runs after the response is sent — Next's own post-response hook, tried
  // here because @vercel/functions' waitUntil silently dropped a second
  // chained background task in local dev during testing. Wrapped so a
  // delivery failure never surfaces to (or fails) the booking itself.
  if (user.email) {
    const emailArgs = {
      eventName: event.name,
      eventDate: event.event_date,
      eventTime: event.event_time,
      venueName: event.venue_name,
      venueAddress: event.venue_address,
      attendeeName: user.name,
      companions,
      flatRateKobo: event.flat_rate_kobo,
      paid,
      managementCode: registration.management_code,
    };
    const emailTo = user.email;
    after(async () => {
      try {
        await sendEventConfirmationEmail(emailTo, emailArgs);
      } catch (e) {
        console.error("[event register] confirmation email failed", e);
      }
    });
  }

  return json(
    {
      ...registration,
      event: reserved,
      attendee_name: user.name,
      attendee_phone: user.phone,
      attendee_email: user.email,
    },
    201,
  );
}
