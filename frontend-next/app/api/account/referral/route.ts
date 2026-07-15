export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { json } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { ensureReferralCode, referralStats, REFERRAL_BONUS_POINTS } from "@/app/api/_lib/referral";

/** GET /account/referral — the customer's referral code + stats. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const [code, stats] = await Promise.all([
    ensureReferralCode(user.id, user.name),
    referralStats(user.id),
  ]);

  return json({ code, bonus_points: REFERRAL_BONUS_POINTS, ...stats });
}
