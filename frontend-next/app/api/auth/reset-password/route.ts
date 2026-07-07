import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** POST /auth/reset-password — set a new password using a valid reset token. */
export async function POST(req: Request) {
  const b = await body<{
    email?: string; token?: string; password?: string; password_confirmation?: string;
  }>(req);

  const errors: Record<string, string[]> = {};
  if (!b.email?.trim()) errors.email = ["Email is required."];
  if (!b.token?.trim()) errors.token = ["Reset token is required."];
  if (!b.password || b.password.length < 8) errors.password = ["Password must be at least 8 characters."];
  if (b.password !== b.password_confirmation) errors.password = ["Passwords do not match."];
  if (Object.keys(errors).length) return validationError(errors);

  const email = b.email!.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.email, email))
    .limit(1);

  const expired = row?.created_at && Date.now() - row.created_at.getTime() > RESET_TTL_MS;
  if (!row || row.token !== b.token!.trim() || expired) {
    return fail("This reset link is invalid or has expired.", 422);
  }

  await db
    .update(users)
    .set({ password: bcrypt.hashSync(b.password!, 12), updated_at: new Date() })
    .where(eq(users.email, email));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

  return json({ message: "Password reset. You can sign in now." });
}
