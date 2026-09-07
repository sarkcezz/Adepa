import { eq, sql } from "drizzle-orm";
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

function shape(row: NonNullable<Awaited<ReturnType<typeof findByCode>>>) {
  return {
    ...row.registration,
    event: row.event,
    attendee_name: row.attendee_name,
    attendee_phone: row.attendee_phone,
    attendee_email: row.attendee_email,
    // Editing contact details here would mean editing a real account by
    // knowing just a booking code — only safe for the synthetic guest user
    // created for this booking, never a real signed-in customer's account.
    contact_editable: row.is_guest,
  };
}

/** GET /events/registrations/:code — look up a booking by its management code. No auth: the code is the credential. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const row = await findByCode(code);
  if (!row) return fail("No booking found with that code.", 404);
  return json(shape(row));
}

/** PATCH /events/registrations/:code — edit companions (always) and contact info (guest bookings only). */
export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const row = await findByCode(code);
  if (!row) return fail("No booking found with that code.", 404);

  const b = await body<{ companions?: string[]; guest_name?: string; guest_phone?: string; guest_email?: string }>(req);

  if (Array.isArray(b.companions)) {
    const companions = b.companions.map((c) => String(c).trim()).filter(Boolean).slice(0, 20);
    const newPartySize = 1 + companions.length;
    const oldPartySize = 1 + (Array.isArray(row.registration.companions) ? row.registration.companions.length : 0);
    const delta = newPartySize - oldPartySize;
    const spotsLeft = row.event.capacity - row.event.registered_count;
    if (delta > spotsLeft) {
      return fail(`Only ${spotsLeft} more spot${spotsLeft === 1 ? "" : "s"} available.`, 422);
    }
    await db.update(eventRegistrations).set({ companions, updated_at: new Date() }).where(eq(eventRegistrations.id, row.registration.id));
    if (delta !== 0) {
      await db.update(porkEvents).set({ registered_count: sql`${porkEvents.registered_count} + ${delta}` }).where(eq(porkEvents.id, row.event.id));
    }
  }

  if (row.is_guest && (b.guest_name || b.guest_phone || b.guest_email !== undefined)) {
    const patch: Record<string, unknown> = {};
    if (b.guest_name?.trim()) patch.name = b.guest_name.trim();
    if (b.guest_phone?.trim()) patch.phone = b.guest_phone.trim();
    if (b.guest_email !== undefined) patch.email = b.guest_email.trim() || null;
    if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, row.customer_id));
  } else if (!row.is_guest && (b.guest_name || b.guest_phone || b.guest_email !== undefined)) {
    return fail("This booking is tied to a signed-in account — sign in to update your name, phone, or email.", 403);
  }

  const updated = await findByCode(code);
  return json(shape(updated!));
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
