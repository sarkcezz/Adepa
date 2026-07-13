export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /admin/analytics/customers — top customers by spend. */
export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      orders: sql<number>`COUNT(${orders.id})`,
      spend_kobo: sql<number>`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.payment_status} = 'PAID'), 0)`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.customer_id, users.id))
    .where(eq(users.role, "customer"))
    .groupBy(users.id, users.name, users.phone)
    .orderBy(desc(sql`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.payment_status} = 'PAID'), 0)`))
    .limit(10);

  return json({
    data: rows.map((r) => ({
      id: r.id, name: r.name, phone: r.phone,
      orders: Number(r.orders), spend_kobo: Number(r.spend_kobo),
    })),
  });
}
