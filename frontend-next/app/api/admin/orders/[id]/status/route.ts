import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatusHistory } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

const STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

/** PATCH /admin/orders/:id/status — advance an order, recording history. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const b = await body<{ status?: string; note?: string }>(req);
  if (!b.status || !STATUSES.includes(b.status as Status)) {
    return validationError({ status: ["A valid status is required."] });
  }

  const [order] = await db
    .update(orders)
    .set({ status: b.status as Status, updated_at: new Date() })
    .where(eq(orders.id, id))
    .returning();
  if (!order) return fail("Order not found.", 404);

  await db.insert(orderStatusHistory).values({
    order_id: id,
    status: b.status as Status,
    changed_by: admin.id,
    note: b.note ?? null,
  });
  await audit(admin, "order.status", {
    subject_type: "Order", subject_id: id, subject_label: order.order_number, note: b.status,
  });

  return json(order);
}
