export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /admin/analytics/employees — POS performance by staff member. */
export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      emp_code: users.employee_id,
      orders: sql<number>`COUNT(${orders.id})`,
      revenue_kobo: sql<number>`COALESCE(SUM(${orders.total_kobo}), 0)`,
    })
    .from(users)
    .leftJoin(
      orders,
      and(eq(orders.employee_id, users.id), eq(orders.source, "EMPLOYEE_SALE")),
    )
    .where(eq(users.role, "employee"))
    .groupBy(users.id, users.name, users.employee_id)
    .orderBy(desc(sql`COALESCE(SUM(${orders.total_kobo}), 0)`));

  return json({
    data: rows.map((r) => ({
      id: r.id, name: r.name, emp_code: r.emp_code ?? "",
      orders: Number(r.orders), revenue_kobo: Number(r.revenue_kobo),
    })),
  });
}
