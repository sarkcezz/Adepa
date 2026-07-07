export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq, ilike, or, and, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { json, paginate } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const search = new URL(req.url).searchParams.get("search")?.trim();
  const filters: SQL[] = [eq(users.role, "customer")];
  if (search) {
    const s = `%${search}%`;
    filters.push(or(ilike(users.name, s), ilike(users.phone, s), ilike(users.email, s))!);
  }

  const rows = await db
    .select()
    .from(users)
    .where(and(...filters))
    .orderBy(desc(users.created_at));

  return json(paginate(rows.map((u) => ({ ...toPublicUser(u), created_at: u.created_at }))));
}
