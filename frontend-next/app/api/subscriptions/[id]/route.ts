export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { nextDeliveryDate } from "@/app/api/_lib/subscriptions";

const STATUSES = ["ACTIVE", "PAUSED", "CANCELLED"] as const;

/** PATCH /subscriptions/:id { status } — pause, resume, or cancel a box. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;
  const { id } = await params;

  const b = await body<{ status?: string }>(req);
  if (!b.status || !STATUSES.includes(b.status as (typeof STATUSES)[number])) {
    return validationError({ status: ["A valid status is required."] });
  }

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.user_id, user.id)))
    .limit(1);
  if (!existing) return fail("Subscription not found.", 404);

  // Resuming from pause restarts the countdown from today rather than
  // delivering immediately against a stale, possibly-past due date.
  const nextDelivery =
    b.status === "ACTIVE" && existing.status === "PAUSED"
      ? nextDeliveryDate(existing.frequency, new Date())
      : existing.next_delivery_date;

  const [updated] = await db
    .update(subscriptions)
    .set({ status: b.status as (typeof STATUSES)[number], next_delivery_date: nextDelivery, updated_at: new Date() })
    .where(eq(subscriptions.id, id))
    .returning();

  return json(updated);
}
