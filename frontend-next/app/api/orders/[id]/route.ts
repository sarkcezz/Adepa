export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory } from "@/db/schema";
import { fail, json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /orders/:id — order with items + status history. Owner, seller, or admin. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return fail("Order not found.", 404);

  const allowed =
    user.role === "admin" ||
    order.customer_id === user.id ||
    order.employee_id === user.id;
  if (!allowed) return fail("This action is unauthorized.", 403);

  const [items, statusHistory] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.order_id, id)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.order_id, id))
      .orderBy(asc(orderStatusHistory.created_at)),
  ]);

  return json({ ...order, items, statusHistory });
}
