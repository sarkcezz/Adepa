export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyLedger } from "@/db/schema";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { loyaltyBalance, redeemValueKobo } from "@/app/api/_lib/loyalty";

/** GET /account/loyalty — the customer's points balance + recent history. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const [balance, history] = await Promise.all([
    loyaltyBalance(user.id),
    db
      .select()
      .from(loyaltyLedger)
      .where(eq(loyaltyLedger.user_id, user.id))
      .orderBy(desc(loyaltyLedger.created_at))
      .limit(50),
  ]);

  return json({ balance, redeemable_kobo: redeemValueKobo(balance), history });
}
