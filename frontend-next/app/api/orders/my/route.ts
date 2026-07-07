export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /orders/my — the signed-in customer's orders. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.customer_id, user.id))
    .orderBy(desc(orders.created_at));

  return json(paginate(rows));
}
