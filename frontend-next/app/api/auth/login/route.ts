import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { issueToken, toPublicUser } from "@/app/api/_lib/auth";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

export async function POST(req: Request) {
  const b = await body<{ email?: string; password?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.email?.trim()) errors.email = ["The email field is required."];
  if (!b.password) errors.password = ["The password field is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const limit = rateLimit(`login:${clientIp(req)}:${b.email!.trim().toLowerCase()}`, 8, 10 * 60_000);
  if (!limit.allowed) return fail(`Too many attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, b.email!.trim().toLowerCase()))
    .limit(1);

  if (!user || !bcrypt.compareSync(b.password!, user.password)) {
    return fail("Invalid email or password.", 401);
  }
  if (!user.is_active) return fail("This account has been deactivated.", 403);

  const token = await issueToken(user.id);
  return json({ user: toPublicUser(user), token });
}
