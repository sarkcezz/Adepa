export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /admin/analytics/products — best sellers by quantity + revenue. */
export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const rows = await db
    .select({
      product_name: orderItems.product_name,
      qty_sold: sql<number>`SUM(${orderItems.quantity})`,
      revenue_kobo: sql<number>`SUM(${orderItems.subtotal_kobo})`,
    })
    .from(orderItems)
    .groupBy(orderItems.product_name)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(10);

  return json({
    data: rows.map((r) => ({
      product_name: r.product_name,
      qty_sold: Number(r.qty_sold),
      revenue_kobo: Number(r.revenue_kobo),
    })),
  });
}
