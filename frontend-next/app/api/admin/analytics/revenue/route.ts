export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /admin/analytics/revenue?period=daily|weekly|monthly — paid revenue buckets. */
export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const period = new URL(req.url).searchParams.get("period") ?? "daily";
  const grain = period === "monthly" ? "month" : period === "weekly" ? "week" : "day";
  const label =
    grain === "month" ? sql`to_char(date_trunc('month', ${orders.created_at}), 'Mon YYYY')`
    : grain === "week" ? sql`to_char(date_trunc('week', ${orders.created_at}), 'DD Mon')`
    : sql`to_char(date_trunc('day', ${orders.created_at}), 'DD Mon')`;

  const rows = await db
    .select({
      label: sql<string>`${label}`,
      bucket: sql<string>`date_trunc(${grain}, ${orders.created_at})`,
      revenue_kobo: sql<number>`COALESCE(SUM(${orders.total_kobo}), 0)`,
    })
    .from(orders)
    .where(eq(orders.payment_status, "PAID"))
    .groupBy(sql`1, 2`)
    .orderBy(sql`2 ASC`)
    .limit(30);

  return json({ data: rows.map((r) => ({ label: r.label, revenue_kobo: Number(r.revenue_kobo) })) });
}
