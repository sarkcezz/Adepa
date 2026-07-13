export const dynamic = "force-dynamic";

import { and, eq, lte, gte, desc } from "drizzle-orm";
import { db } from "@/db";
import { standAnnouncements } from "@/db/schema";
import { json } from "@/app/api/_lib/http";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const rows = await db
    .select()
    .from(standAnnouncements)
    .where(
      and(
        eq(standAnnouncements.is_published, true),
        lte(standAnnouncements.start_date, today),
        gte(standAnnouncements.end_date, today),
      ),
    )
    .orderBy(desc(standAnnouncements.start_date));

  return json({ data: rows });
}