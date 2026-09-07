import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { audit } from "@/app/api/_lib/admin";

/**
 * DELETE /admin/orders/:id — permanently remove an order.
 *
 * This is irreversible and removes real sales history: order_items and
 * order_status_history cascade away with it, and campaign_usages does too
 * (so a promo use is handed back). Reviews and loyalty_ledger rows survive
 * with their order_id nulled — points already earned or spent are left
 * alone rather than silently clawed back.
 *
 * The full order is written into the audit log first, so a deletion is
 * always traceable to who did it and what it was worth.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return fail("Order not found.", 404);

  const items = await db
    .select({
      product_name: orderItems.product_name,
      quantity: orderItems.quantity,
      subtotal_kobo: orderItems.subtotal_kobo,
    })
    .from(orderItems)
    .where(eq(orderItems.order_id, id));

  await audit(admin, "order.delete", {
    subject_type: "Order",
    subject_id: id,
    subject_label: order.order_number,
    changes: {
      order_number: order.order_number,
      customer_id: order.customer_id,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      total_kobo: order.total_kobo,
      created_at: order.created_at,
      items,
    },
    note: "Order permanently deleted",
  });

  await db.delete(orders).where(eq(orders.id, id));

  return json({ deleted: true });
}
