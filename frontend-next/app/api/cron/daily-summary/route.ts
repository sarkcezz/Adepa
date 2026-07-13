export const dynamic = "force-dynamic";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { assertCron } from "@/app/api/_lib/cron";
import { sendEmail } from "@/app/api/_lib/notify";

/** GET /api/cron/daily-summary — yesterday's sales digest (Vercel Cron). */
export async function GET(req: Request) {
  const blocked = assertCron(req);
  if (blocked) return blocked;

  const [row] = await db
    .select({
      orders: sql<number>`COUNT(*) FILTER (WHERE ${orders.created_at} >= CURRENT_DATE - INTERVAL '1 day' AND ${orders.created_at} < CURRENT_DATE)`,
      revenue_kobo: sql<number>`COALESCE(SUM(${orders.total_kobo}) FILTER (WHERE ${orders.created_at} >= CURRENT_DATE - INTERVAL '1 day' AND ${orders.created_at} < CURRENT_DATE AND ${orders.payment_status} = 'PAID'), 0)`,
    })
    .from(orders);

  const summary = { orders: Number(row?.orders ?? 0), revenue_kobo: Number(row?.revenue_kobo ?? 0) };

  await sendEmail(
    process.env.ADMIN_ALERT_EMAIL ?? "admin@adepaporkhub.shop",
    "Adepa — yesterday's summary",
    `Orders: ${summary.orders}\nRevenue: GHS ${(summary.revenue_kobo / 100).toFixed(2)}`,
  );

  return json({ sent: true, ...summary });
}
