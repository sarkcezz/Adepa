import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, porkEvents, users } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";

async function findByCode(code: string) {
  const [row] = await db
    .select({
      registration: eventRegistrations,
      event: porkEvents,
      attendee_name: users.name,
      attendee_phone: users.phone,
      attendee_email: users.email,
      is_guest: users.is_guest,
      customer_id: users.id,
    })
    .from(eventRegistrations)
    .innerJoin(porkEvents, eq(porkEvents.id, eventRegistrations.event_id))
    .innerJoin(users, eq(users.id, eventRegistrations.customer_id))
    .where(eq(eventRegistrations.management_code, code.toUpperCase()))
    .limit(1);
  return row;
}

/** GET /events/registrations/:code — look up a booking by its management code. No auth: the code is the credential. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const row = await findByCode(code);
  if (!row) return fail("No booking found with that code.", 404);
  return json({
    ...row.registration,
    event: row.event,
    attendee_name: row.attendee_name,
    attendee_phone: row.attendee_phone,
    attendee_email: row.attendee_email,
    // Editing contact details here would mean editing a real account by
    // knowing just a booking code — only safe for the synthetic guest user
    // created for this booking, never a real signed-in customer's account.
    contact_editable: row.is_guest,
  });
}

/** PATCH /events/registrations/:code — edit companions (always) and contact info (guest bookings only). */
export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const row = await findByCode(code);
  if (!row) return fail("No booking found with that code.", 404);

  const b = await body<{ companions?: string[]; guest_name?: string; guest_phone?: string; guest_email?: string }>(req);

  let registration = row.registration;
  let event = row.event;
  let attendee_name = row.attendee_name;
  let attendee_phone = row.attendee_phone;
  let attendee_email = row.attendee_email;

  if (Array.isArray(b.companions)) {
    const companions = b.companions.map((c) => String(c).trim()).filter(Boolean).slice(0, 20);
    const oldPartySize = 1 + (Array.isArray(row.registration.companions) ? row.registration.companions.length : 0);
    const delta = 1 + companions.length - oldPartySize;

    if (delta > 0) {
      // Same atomic reserve-or-reject as new bookings — a plain read-then-write
      // here would let two concurrent edits jointly oversell the event.
      const [reservedEvent] = await db
        .update(porkEvents)
        .set({ registered_count: sql`${porkEvents.registered_count} + ${delta}` })
        .where(and(eq(porkEvents.id, event.id), sql`${porkEvents.registered_count} + ${delta} <= ${porkEvents.capacity}`))
        .returning();
      if (!reservedEvent) {
        const spotsLeft = event.capacity - event.registered_count;
        return fail(`Only ${spotsLeft} more spot${spotsLeft === 1 ? "" : "s"} available.`, 422);
      }
      event = reservedEvent;
    } else if (delta < 0) {
      [event] = await db
        .update(porkEvents)
        .set({ registered_count: sql`GREATEST(${porkEvents.registered_count} + ${delta}, 0)` })
        .where(eq(porkEvents.id, event.id))
        .returning();
    }

    [registration] = await db
      .update(eventRegistrations)
      .set({ companions, updated_at: new Date() })
      .where(eq(eventRegistrations.id, registration.id))
      .returning();
  }

  const wantsContactChange = !!(b.guest_name || b.guest_phone || b.guest_email !== undefined);
  if (wantsContactChange) {
    if (!row.is_guest) {
      return fail("This booking is tied to a signed-in account — sign in to update your name, phone, or email.", 403);
    }
    const patch: Record<string, unknown> = {};
    if (b.guest_name?.trim()) patch.name = b.guest_name.trim();
    if (b.guest_phone?.trim()) patch.phone = b.guest_phone.trim();
    if (b.guest_email !== undefined) patch.email = b.guest_email.trim() || null;
    if (Object.keys(patch).length) {
      const [updatedUser] = await db.update(users).set(patch).where(eq(users.id, row.customer_id)).returning();
      attendee_name = updatedUser.name;
      attendee_phone = updatedUser.phone;
      attendee_email = updatedUser.email;
    }
  }

  return json({
    ...registration,
    event,
    attendee_name,
    attendee_phone,
    attendee_email,
    contact_editable: row.is_guest,
  });
}

/** DELETE /events/registrations/:code — cancel a booking and free up its spots. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const row = await findByCode(code);
  if (!row) return fail("No booking found with that code.", 404);

  const partySize = 1 + (Array.isArray(row.registration.companions) ? row.registration.companions.length : 0);
  await db.delete(eventRegistrations).where(eq(eventRegistrations.id, row.registration.id));
  await db.update(porkEvents).set({ registered_count: sql`GREATEST(${porkEvents.registered_count} - ${partySize}, 0)` }).where(eq(porkEvents.id, row.event.id));

  return json({ cancelled: true });
}
