import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { porkEvents, eventRegistrations } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { resolveCheckoutUser } from "@/app/api/_lib/auth";
import { notifyUser } from "@/app/api/_lib/notifications";
import { sendEventConfirmationEmail } from "@/app/api/_lib/event-email";

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L — easy to read back over the phone
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

/** POST /events/:id/register — book a spot, signed in or as a guest. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const spotsLeft = event.capacity - event.registered_count;
  if (partySize > spotsLeft) {
    return fail(spotsLeft <= 0 ? "This event is sold out." : `Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left — try a smaller party.`, 422);
  }

  const user = await resolveCheckoutUser(req, { name: b.guest_name, phone: b.guest_phone, email: b.guest_email });
  if (user instanceof NextResponse) return user;

  const [existing] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.event_id, id), eq(eventRegistrations.customer_id, user.id)))
    .limit(1);
  if (existing) return fail("This phone number is already registered for this event. Use your booking code to view or change it.", 422);

  // Free events need no payment; paid events settle in cash at the event door (online payment isn't set up yet).
  const paid = event.flat_rate_kobo === 0;

  let registration;
  for (let attempt = 0; ; attempt++) {
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
      const code = e && typeof e === "object" && "code" in e ? (e as { code?: unknown }).code : undefined;
      if (code === "23505" && attempt < 5) continue; // management_code collision — regenerate and retry
      throw e;
    }
  }

  await db
    .update(porkEvents)
    .set({ registered_count: sql`${porkEvents.registered_count} + ${partySize}` })
    .where(eq(porkEvents.id, id));

  // SMS/in-app notification is fire-and-forget, matching the rest of the app.
  waitUntil(
    notifyUser(user.id, {
      type: "event.registered",
      title: `You're booked for ${event.name}`,
      message: `Party of ${partySize}. Booking code: ${registration.management_code}.`,
      sms: true,
    }),
  );
  // Awaited directly rather than via waitUntil — a second background task
  // chained after the first isn't reliably given time to run in every
  // runtime. Wrapped so a delivery failure never fails the booking itself.
  if (user.email) {
    try {
      await sendEventConfirmationEmail(user.email, {
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
      });
    } catch (e) {
      console.error("[event register] confirmation email failed", e);
    }
  }

  return json(
    {
      ...registration,
      event: {
        id: event.id,
        name: event.name,
        event_date: event.event_date,
        event_time: event.event_time,
        venue_name: event.venue_name,
        venue_address: event.venue_address,
        flat_rate_kobo: event.flat_rate_kobo,
      },
      attendee_name: user.name,
      attendee_phone: user.phone,
      attendee_email: user.email,
    },
    201,
  );
}
