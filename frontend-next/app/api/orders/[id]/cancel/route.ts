import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatusHistory } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { sendEmail } from "@/app/api/_lib/notify";

/** POST /orders/:id/cancel — customer cancels their own order, PENDING only. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return fail("Order not found.", 404);
  if (order.customer_id !== user.id) return fail("This action is unauthorized.", 403);
  if (order.status !== "PENDING") {
    return fail("This order can no longer be cancelled here. Please contact us.", 422);
  }

  const [updated] = await db
    .update(orders)
    .set({ status: "CANCELLED", updated_at: new Date() })
    .where(eq(orders.id, id))
    .returning();
  await db.insert(orderStatusHistory).values({
    order_id: id,
    status: "CANCELLED",
    changed_by: user.id,
    note: "Cancelled by customer.",
  });

  void sendEmail(
    process.env.ADMIN_ALERT_EMAIL ?? "admin@adepaporkhub.shop",
    `Order ${order.order_number} cancelled by customer`,
    `${user.name} (${user.phone}) cancelled order ${order.order_number} before confirmation.`,
  );

  return json(updated);
}
