export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /orders/my-sales/summary — today/week/month totals for the employee. */
export async function GET(req: Request) {
  const staff = await guard(req, ["employee", "admin"]);
  if (staff instanceof NextResponse) return staff;

  const mine = and(eq(orders.employee_id, staff.id), eq(orders.source, "EMPLOYEE_SALE"));

  const [row] = await db
    .select({
      today_count: sql<number>`COUNT(*) FILTER (WHERE ${orders.created_at} >= CURRENT_DATE)`,
      today_total: sql<number>`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.created_at} >= CURRENT_DATE), 0)`,
      week_total: sql<number>`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.created_at} >= date_trunc('week', CURRENT_DATE)), 0)`,
      month_total: sql<number>`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.created_at} >= date_trunc('month', CURRENT_DATE)), 0)`,
    })
    .from(orders)
    .where(mine);

  return json({
    today_count: Number(row?.today_count ?? 0),
    today_total: Number(row?.today_total ?? 0),
    week_total: Number(row?.week_total ?? 0),
    month_total: Number(row?.month_total ?? 0),
  });
}
