export const dynamic = "force-dynamic";

import { and, eq, lte, gte, desc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { json } from "@/app/api/_lib/http";

/** GET /campaigns/active — publicly visible promotions for the Promotions page. */
export async function GET() {
  const now = new Date();

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      code: campaigns.code,
      discount_type: campaigns.discount_type,
      discount_value: campaigns.discount_value,
      min_order_kobo: campaigns.min_order_kobo,
      valid_to: campaigns.valid_to,
    })
    .from(campaigns)
    .where(and(eq(campaigns.is_active, true), lte(campaigns.valid_from, now), gte(campaigns.valid_to, now)))
    .orderBy(desc(campaigns.valid_from));

  return json({ data: rows });
}
