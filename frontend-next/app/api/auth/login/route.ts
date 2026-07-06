import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { issueToken, toPublicUser } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const b = await body<{ email?: string; password?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.email?.trim()) errors.email = ["The email field is required."];
  if (!b.password) errors.password = ["The password field is required."];
  if (Object.keys(errors).length) return validationError(errors);

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
