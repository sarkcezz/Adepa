import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents, eventRegistrations } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { verifyTransaction } from "@/app/api/_lib/paystack";

/** POST /events/:id/register — register the signed-in customer for an event. */
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

  let paid = false;
  if (b.paystack_reference) {
    const verified = await verifyTransaction(b.paystack_reference, event.flat_rate_kobo);
    if (!verified.ok) {
      return fail("We couldn't confirm this payment. If you were charged, contact support before retrying.", 402);
    }
    paid = true;
  }

  const [registration] = await db
    .insert(eventRegistrations)
    .values({
      event_id: id,
      customer_id: user.id,
      payment_status: paid ? "PAID" : "PENDING",
      paystack_reference: b.paystack_reference ?? null,
    })
    .returning();

  await db
    .update(porkEvents)
    .set({ registered_count: sql`${porkEvents.registered_count} + 1` })
    .where(eq(porkEvents.id, id));

  return json(registration, 201);
}
