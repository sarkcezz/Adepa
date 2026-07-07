export const dynamic = "force-dynamic";

import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { assertCron } from "@/app/api/_lib/cron";
import { sendEmail } from "@/app/api/_lib/notify";

const THRESHOLD = 10;

/** GET /api/cron/low-stock — daily low-stock alert (Vercel Cron). */
export async function GET(req: Request) {
  const blocked = assertCron(req);
  if (blocked) return blocked;

  const low = await db
    .select({ id: products.id, name: products.name, stock_qty: products.stock_qty })
    .from(products)
    .where(and(eq(products.is_active, true), lte(products.stock_qty, THRESHOLD)));

  if (low.length) {
    const lines = low.map((p) => `- ${p.name}: ${p.stock_qty} left`).join("\n");
    await sendEmail(
      process.env.ADMIN_ALERT_EMAIL ?? "admin@adepaporkhub.shop",
      `Low stock: ${low.length} item(s)`,
      `The following products are at or below ${THRESHOLD} units:\n\n${lines}`,
    );
  }

  return json({ checked: true, low_stock_count: low.length, items: low });
}
