export const dynamic = "force-dynamic";

import { and, eq, gte, asc } from "drizzle-orm";
import { db } from "@/db";
import { porkEvents } from "@/db/schema";
import { json } from "@/app/api/_lib/http";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(porkEvents)
    .where(and(eq(porkEvents.status, "PUBLISHED"), gte(porkEvents.event_date, today)))
    .orderBy(asc(porkEvents.event_date));

  return json({ data: rows });
}