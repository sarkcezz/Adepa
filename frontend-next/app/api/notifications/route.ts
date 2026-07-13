export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /notifications — the signed-in user's recent notifications + unread count. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.user_id, user.id))
    .orderBy(desc(notifications.created_at))
    .limit(30);

  const [{ unread }] = await db
    .select({ unread: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.user_id, user.id), eq(notifications.is_read, false)));

  return json({ data: rows, unread_count: Number(unread) });
}
