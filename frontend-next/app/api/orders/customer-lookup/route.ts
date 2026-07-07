export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, or, like } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /orders/customer-lookup?phone= — POS customer lookup by phone. */
export async function GET(req: Request) {
  const staff = await guard(req, ["employee", "admin"]);
  if (staff instanceof NextResponse) return staff;

  const phone = (new URL(req.url).searchParams.get("phone") ?? "").replace(/\s+/g, "");
  if (phone.length < 6) return json({ customer: null });

  const [customer] = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(
      and(
        eq(users.role, "customer"),
        or(eq(users.phone, phone), like(users.phone, "%" + phone.slice(-9))),
      ),
    )
    .limit(1);

  return json({ customer: customer ?? null });
}
