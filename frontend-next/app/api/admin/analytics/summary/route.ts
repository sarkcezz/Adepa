export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users, products } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const [o] = await db
    .select({
      total_revenue_kobo: sql<number>`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.payment_status} = 'PAID'), 0)`,
      orders_today: sql<number>`COUNT(*) FILTER (WHERE ${orders.created_at} >= CURRENT_DATE)`,
      orders_this_month: sql<number>`COUNT(*) FILTER (WHERE ${orders.created_at} >= date_trunc('month', CURRENT_DATE))`,
      pending_orders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'PENDING')`,
    })
    .from(orders);

  const [c] = await db
    .select({ total_customers: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, "customer"));

  const [p] = await db
    .select({ active_products: sql<number>`COUNT(*)` })
    .from(products)
    .where(eq(products.is_active, true));

  return json({
    total_revenue_kobo: Number(o?.total_revenue_kobo ?? 0),
    orders_today: Number(o?.orders_today ?? 0),
    orders_this_month: Number(o?.orders_this_month ?? 0),
    total_customers: Number(c?.total_customers ?? 0),
    active_products: Number(p?.active_products ?? 0),
    pending_orders: Number(o?.pending_orders ?? 0),
  });
}
