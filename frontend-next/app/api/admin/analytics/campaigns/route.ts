export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignUsages } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";

/** GET /admin/analytics/campaigns — usage + discount given per campaign. */
export async function GET(req: Request) {
  const admin = await guard(req, ["admin"]);
  if (admin instanceof NextResponse) return admin;

  const rows = await db
    .select({
      id: campaigns.id,
      code: campaigns.code,
      name: campaigns.name,
      usage_count: campaigns.usage_count,
      is_active: campaigns.is_active,
      discount_kobo: sql<number>`COALESCE(SUM(${campaignUsages.discount_applied_kobo}), 0)`,
    })
    .from(campaigns)
    .leftJoin(campaignUsages, eq(campaignUsages.campaign_id, campaigns.id))
    .groupBy(campaigns.id, campaigns.code, campaigns.name, campaigns.usage_count, campaigns.is_active)
    .orderBy(desc(campaigns.usage_count));

  return json({
    data: rows.map((r) => ({
      id: r.id, code: r.code, name: r.name,
      usage_count: r.usage_count, discount_kobo: Number(r.discount_kobo), is_active: r.is_active,
    })),
  });
}
