import bcrypt from "bcryptjs";
import { or, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { issueToken, toPublicUser } from "@/app/api/_lib/auth";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";
import { ensureReferralCode } from "@/app/api/_lib/referral";

export async function POST(req: Request) {
  const limit = rateLimit(`register:${clientIp(req)}`, 10, 60 * 60_000);
  if (!limit.allowed) return fail(`Too many attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const b = await body<{ name?: string; email?: string; phone?: string; password?: string; ref?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.trim()) errors.name = ["The name field is required."];
  if (!b.email?.trim()) errors.email = ["The email field is required."];
  if (!b.phone?.trim()) errors.phone = ["The phone field is required."];
  if (!b.password || b.password.length < 8) errors.password = ["The password must be at least 8 characters."];
  if (Object.keys(errors).length) return validationError(errors);

  const email = b.email!.trim().toLowerCase();
  const phone = b.phone!.trim();

  const [existing] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.phone, phone)))
    .limit(1);

  let referredBy: string | null = null;
  if (b.ref?.trim()) {
    const [referrer] = await db.select({ id: users.id }).from(users).where(eq(users.referral_code, b.ref.trim().toUpperCase())).limit(1);
    if (referrer && referrer.id !== existing?.id) referredBy = referrer.id;
  }

  let user: typeof users.$inferSelect | undefined;
  if (existing) {
    // A guest checkout can be "claimed" into a real account instead of blocking
    // registration — the guest row already holds their order history.
    if (!existing.is_guest) {
      return validationError({ email: ["An account with this email or phone already exists."] });
    }
    [user] = await db
      .update(users)
      .set({
        name: b.name!.trim(),
        email,
        phone,
        password: bcrypt.hashSync(b.password!, 12),
        is_guest: false,
        referred_by_user_id: existing.referred_by_user_id ?? referredBy,
      })
      .where(eq(users.id, existing.id))
      .returning();
  } else {
    [user] = await db
      .insert(users)
      .values({
        name: b.name!.trim(),
        email,
        phone,
        password: bcrypt.hashSync(b.password!, 12),
        role: "customer",
        referred_by_user_id: referredBy,
      })
      .returning();
  }

  if (!user) return fail("Could not create account.", 500);
  const referralCode = await ensureReferralCode(user.id, user.name);

  const token = await issueToken(user.id);
  return json({ user: toPublicUser({ ...user, referral_code: referralCode }), token }, 201);
}
