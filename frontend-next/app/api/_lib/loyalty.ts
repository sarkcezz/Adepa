import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyLedger, users } from "@/db/schema";
import { notifyUser } from "./notifications";

/** 1 point per GHS 10 spent; redeemable at GHS 0.10 per point (100 pts = GHS 10). */
export const KOBO_PER_POINT_EARNED = 1000;
export const KOBO_PER_POINT_REDEEMED = 10;

export const pointsForSpend = (kobo: number) => Math.floor(kobo / KOBO_PER_POINT_EARNED);
export const redeemValueKobo = (points: number) => points * KOBO_PER_POINT_REDEEMED;

export async function loyaltyBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${loyaltyLedger.points}), 0)` })
    .from(loyaltyLedger)
    .where(eq(loyaltyLedger.user_id, userId));
  return Number(row?.total ?? 0);
}

/** Records an earn (positive points) or redemption (negative points) entry. */
export async function recordPoints(
  userId: string,
  points: number,
  reason: string,
  orderId?: string,
  note?: string,
) {
  if (points === 0) return;
  await db.insert(loyaltyLedger).values({ user_id: userId, points, reason, order_id: orderId ?? null, note: note ?? null });
}

const BIRTHDAY_BONUS_POINTS = 50;

/**
 * Awards a once-a-year bonus to anyone whose birthday is today. Called from
 * the daily-summary cron rather than its own schedule to stay within the
 * Vercel plan's cron job count.
 */
export async function runBirthdayRewards(): Promise<{ checked: number; rewarded: number }> {
  const todaysBirthdays = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.is_active, true),
        sql`${users.birth_date} is not null`,
        sql`EXTRACT(MONTH FROM ${users.birth_date}) = EXTRACT(MONTH FROM CURRENT_DATE)`,
        sql`EXTRACT(DAY FROM ${users.birth_date}) = EXTRACT(DAY FROM CURRENT_DATE)`,
      ),
    );

  let rewarded = 0;
  for (const u of todaysBirthdays) {
    const [already] = await db
      .select({ id: loyaltyLedger.id })
      .from(loyaltyLedger)
      .where(
        and(
          eq(loyaltyLedger.user_id, u.id),
          eq(loyaltyLedger.reason, "BIRTHDAY_BONUS"),
          sql`EXTRACT(YEAR FROM ${loyaltyLedger.created_at}) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        ),
      )
      .limit(1);
    if (already) continue;

    await recordPoints(u.id, BIRTHDAY_BONUS_POINTS, "BIRTHDAY_BONUS", undefined, "Happy birthday!");
    await notifyUser(u.id, {
      type: "loyalty.birthday",
      title: "Happy birthday from Adepa Pork Hub!",
      message: `We've added ${BIRTHDAY_BONUS_POINTS} reward points to your account — enjoy a treat on us.`,
      email: true,
      sms: false,
    });
    rewarded++;
  }

  return { checked: todaysBirthdays.length, rewarded };
}
