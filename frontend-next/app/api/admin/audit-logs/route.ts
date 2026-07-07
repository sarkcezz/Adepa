export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

const PER_PAGE = 30;

export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const action = sp.get("action")?.trim();
  const where = action && action !== "ALL" ? eq(auditLogs.action, action) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(auditLogs).where(where);
  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.created_at))
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  return json({
    data: rows,
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / PER_PAGE)),
    total,
  });
}
