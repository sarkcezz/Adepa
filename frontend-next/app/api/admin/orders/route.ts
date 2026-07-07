export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

type OrderStatus = typeof orders.status.enumValues[number];

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const search = sp.get("search")?.trim();

  const filters: SQL[] = [];
  if (status && status !== "ALL") filters.push(eq(orders.status, status as OrderStatus));
  if (search) {
    const s = `%${search}%`;
    filters.push(or(ilike(orders.order_number, s), ilike(orders.paystack_reference, s))!);
  }

  const rows = await db
    .select()
    .from(orders)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(orders.created_at));

  return json(paginate(rows));
}
