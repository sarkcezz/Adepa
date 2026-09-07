import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRegistrations, porkEvents, users } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/** PUT /admin/events/:id/registrations/:regId — edit a registrant's contact info and/or party. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string; regId: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id, regId } = await params;

  const [reg] = await db
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.id, regId), eq(eventRegistrations.event_id, id)))
    .limit(1);
  if (!reg) return fail("Registration not found.", 404);

  const b = await body<{ name?: string; phone?: string; email?: string | null; companions?: string[] }>(req);

  const userPatch: Record<string, unknown> = {};
  if (b.name?.trim()) userPatch.name = b.name.trim();
  if (b.phone?.trim()) userPatch.phone = b.phone.trim();
  if (b.email !== undefined) userPatch.email = b.email?.trim() || null;
  if (Object.keys(userPatch).length) {
    await db.update(users).set(userPatch).where(eq(users.id, reg.customer_id));
  }

  let registration = reg;
  if (Array.isArray(b.companions)) {
    const companions = b.companions.map((c) => String(c).trim()).filter(Boolean).slice(0, 20);
    const oldPartySize = 1 + (Array.isArray(reg.companions) ? reg.companions.length : 0);
    const delta = 1 + companions.length - oldPartySize;

    if (delta > 0) {
      // Same atomic reserve-or-reject the public routes use — an admin edit
      // shouldn't be able to oversell the event either.
      const [reserved] = await db
        .update(porkEvents)
        .set({ registered_count: sql`${porkEvents.registered_count} + ${delta}` })
        .where(and(eq(porkEvents.id, id), sql`${porkEvents.registered_count} + ${delta} <= ${porkEvents.capacity}`))
        .returning();
      if (!reserved) {
        const [event] = await db.select({ capacity: porkEvents.capacity, registered_count: porkEvents.registered_count }).from(porkEvents).where(eq(porkEvents.id, id)).limit(1);
        const spotsLeft = event ? event.capacity - event.registered_count : 0;
        return fail(`Only ${spotsLeft} more spot${spotsLeft === 1 ? "" : "s"} available.`, 422);
      }
    } else if (delta < 0) {
      await db.update(porkEvents).set({ registered_count: sql`GREATEST(${porkEvents.registered_count} + ${delta}, 0)` }).where(eq(porkEvents.id, id));
    }

    [registration] = await db
      .update(eventRegistrations)
      .set({ companions, updated_at: new Date() })
      .where(eq(eventRegistrations.id, regId))
      .returning();
  }

  const [user] = await db.select().from(users).where(eq(users.id, reg.customer_id)).limit(1);

  await audit(admin, "event.registrant.update", { subject_type: "EventRegistration", subject_id: regId, subject_label: user?.name });
  return json({
    ...registration,
    customer_name: user?.name,
    customer_phone: user?.phone,
    customer_email: user?.email,
  });
}

/** DELETE /admin/events/:id/registrations/:regId — remove a registrant and free their spots. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; regId: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id, regId } = await params;

  const [reg] = await db
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.id, regId), eq(eventRegistrations.event_id, id)))
    .limit(1);
  if (!reg) return fail("Registration not found.", 404);

  const partySize = 1 + (Array.isArray(reg.companions) ? reg.companions.length : 0);
  await db.delete(eventRegistrations).where(eq(eventRegistrations.id, regId));
  await db
    .update(porkEvents)
    .set({ registered_count: sql`GREATEST(${porkEvents.registered_count} - ${partySize}, 0)` })
    .where(eq(porkEvents.id, id));

  await audit(admin, "event.registrant.remove", { subject_type: "EventRegistration", subject_id: regId });
  return json({ deleted: true });
}
