import { and, count, eq, not } from "drizzle-orm";
import { db } from "@/db";
import { users, orders, loyaltyLedger } from "@/db/schema";
import { recordPoints } from "./loyalty";

export const REFERRAL_BONUS_POINTS = 100;

function randomCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase().padEnd(4, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

/** Generates and persists a unique referral code for a user who doesn't have one yet. */
export async function ensureReferralCode(userId: string, name: string): Promise<string> {
  const [existing] = await db.select({ referral_code: users.referral_code }).from(users).where(eq(users.id, userId)).limit(1);
  if (existing?.referral_code) return existing.referral_code;

  for (let i = 0; i < 5; i++) {
    const code = randomCode(name);
    const [clash] = await db.select({ id: users.id }).from(users).where(eq(users.referral_code, code)).limit(1);
    if (!clash) {
      await db.update(users).set({ referral_code: code }).where(eq(users.id, userId));
      return code;
    }
  }
  throw new Error("Could not generate a unique referral code.");
}

export async function referralStats(userId: string) {
  const [referred] = await db.select({ n: count() }).from(users).where(eq(users.referred_by_user_id, userId));
  const [rewarded] = await db
    .select({ n: count() })
    .from(loyaltyLedger)
    .where(and(eq(loyaltyLedger.user_id, userId), eq(loyaltyLedger.reason, "REFERRAL_BONUS")));
  return { referred_count: Number(referred?.n ?? 0), rewarded_count: Number(rewarded?.n ?? 0) };
}

/**
 * Awards both sides of a referral the first time the referred customer's
 * order is paid. Idempotent — checks for an existing ledger entry before
 * awarding, since order status can be touched more than once.
 */
export async function awardReferralBonusIfEligible(orderId: string, customerId: string) {
  const [customer] = await db.select({ referred_by_user_id: users.referred_by_user_id }).from(users).where(eq(users.id, customerId)).limit(1);
  if (!customer?.referred_by_user_id) return;

  const [priorPaid] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.customer_id, customerId), eq(orders.payment_status, "PAID"), not(eq(orders.id, orderId))));
  if (Number(priorPaid?.n ?? 0) > 0) return; // not their first paid order

  const [already] = await db
    .select({ id: loyaltyLedger.id })
    .from(loyaltyLedger)
    .where(and(eq(loyaltyLedger.order_id, orderId), eq(loyaltyLedger.reason, "REFERRAL_BONUS")))
    .limit(1);
  if (already) return;

  await recordPoints(customer.referred_by_user_id, REFERRAL_BONUS_POINTS, "REFERRAL_BONUS", orderId, "Referral bonus — friend's first order");
  await recordPoints(customerId, REFERRAL_BONUS_POINTS, "REFERRAL_BONUS", orderId, "Referral welcome bonus");
}
