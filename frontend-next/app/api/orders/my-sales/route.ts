export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /orders/my-sales — the signed-in employee's POS sales. */
export async function GET(req: Request) {
  const staff = await guard(req, ["employee", "admin"]);
  if (staff instanceof NextResponse) return staff;

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.employee_id, staff.id), eq(orders.source, "EMPLOYEE_SALE")))
    .orderBy(desc(orders.created_at));

  return json(paginate(rows));
}
