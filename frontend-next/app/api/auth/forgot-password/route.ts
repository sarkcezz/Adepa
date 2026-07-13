import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { body, fail, json } from "@/app/api/_lib/http";
import { sendEmail } from "@/app/api/_lib/notify";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";
import { siteUrl } from "@/lib/site";

/**
 * POST /auth/forgot-password — issue a reset token. Always returns a generic
 * success (no account enumeration).
 */
export async function POST(req: Request) {
  const limit = rateLimit(`forgot-password:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limit.allowed) return fail(`Too many attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const b = await body<{ email?: string }>(req);
  const email = b.email?.trim().toLowerCase();
  const generic = { message: "If an account exists, a reset link has been sent." };
  if (!email) return json(generic);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db
      .insert(passwordResetTokens)
      .values({ email, token, created_at: new Date() })
      .onConflictDoUpdate({ target: passwordResetTokens.email, set: { token, created_at: new Date() } });

    const link = `${siteUrl()}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
    waitUntil(sendEmail(
      email,
      "Reset your Adepa password",
      `Reset your password: ${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    ));
  }

  return json(generic);
}
