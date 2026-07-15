import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { issueToken, toPublicUser } from "@/app/api/_lib/auth";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

/**
 * Staff sign-in — identifies by employee ID (e.g. "APH-0001") or by an
 * @adepaporkhub.shop email (admins have no employee_id, only an email).
 * The unified /login page decides which endpoint to call based on the
 * identifier's shape; this route just resolves whichever column applies.
 */
export async function POST(req: Request) {
  const b = await body<{ identifier?: string; password?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.identifier?.trim()) errors.identifier = ["The employee ID or email field is required."];
  if (!b.password) errors.password = ["The password field is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const raw = b.identifier!.trim();
  const isEmail = raw.includes("@");

  const limit = rateLimit(`emp-login:${clientIp(req)}:${raw.toLowerCase()}`, 8, 10 * 60_000);
  if (!limit.allowed) return fail(`Too many attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const [user] = await db
    .select()
    .from(users)
    .where(isEmail ? eq(users.email, raw.toLowerCase()) : eq(users.employee_id, raw.toUpperCase()))
    .limit(1);

  if (!user || !bcrypt.compareSync(b.password!, user.password)) {
    return fail("Invalid employee ID/email or password.", 401);
  }
  if (user.role !== "employee" && user.role !== "admin") {
    return fail("This account is not a staff account.", 403);
  }
  if (!user.is_active) return fail("This account has been deactivated.", 403);

  const token = await issueToken(user.id, "pos");
  return json({ user: toPublicUser(user), token });
}
