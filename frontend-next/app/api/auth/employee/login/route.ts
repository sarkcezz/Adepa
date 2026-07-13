import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { issueToken, toPublicUser } from "@/app/api/_lib/auth";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

export async function POST(req: Request) {
  const b = await body<{ employee_id?: string; password?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.employee_id?.trim()) errors.employee_id = ["The employee ID field is required."];
  if (!b.password) errors.password = ["The password field is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const limit = rateLimit(`emp-login:${clientIp(req)}:${b.employee_id!.trim().toUpperCase()}`, 8, 10 * 60_000);
  if (!limit.allowed) return fail(`Too many attempts. Try again in ${limit.retryAfterSec}s.`, 429);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.employee_id, b.employee_id!.trim().toUpperCase()))
    .limit(1);

  if (!user || !bcrypt.compareSync(b.password!, user.password)) {
    return fail("Invalid employee ID or password.", 401);
  }
  if (user.role !== "employee" && user.role !== "admin") {
    return fail("This account is not a staff account.", 403);
  }
  if (!user.is_active) return fail("This account has been deactivated.", 403);

  const token = await issueToken(user.id, "pos");
  return json({ user: toPublicUser(user), token });
}
