import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents, eventRegistrations } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/**
 * POST /events/:id/register — register the signed-in customer for an event.
 * Paystack verification is deferred (Phase 5b); a supplied reference is
 * currently trusted and marked PAID, otherwise the registration is PENDING.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;
  const { id } = await params;

  const b = await body<{ paystack_reference?: string }>(req);

  const [event] = await db.select().from(porkEvents).where(eq(porkEvents.id, id)).limit(1);
  if (!event || event.status !== "PUBLISHED") return fail("Event not found.", 404);
  if (event.registered_count >= event.capacity) return fail("This event is sold out.", 422);

  const [existing] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.event_id, id), eq(eventRegistrations.customer_id, user.id)))
    .limit(1);
  if (existing) return fail("You are already registered for this event.", 422);

  const [registration] = await db
    .insert(eventRegistrations)
    .values({
      event_id: id,
      customer_id: user.id,
      payment_status: b.paystack_reference ? "PAID" : "PENDING",
      paystack_reference: b.paystack_reference ?? null,
    })
    .returning();

  await db
    .update(porkEvents)
    .set({ registered_count: sql`${porkEvents.registered_count} + 1` })
    .where(eq(porkEvents.id, id));

  return json(registration, 201);
}
