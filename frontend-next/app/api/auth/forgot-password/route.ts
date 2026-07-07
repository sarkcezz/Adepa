import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { body, json } from "@/app/api/_lib/http";

/**
 * POST /auth/forgot-password — issue a reset token. Always returns a generic
 * success (no account enumeration). Email delivery is wired up in Phase 7;
 * for now the token is persisted for the reset step.
 */
export async function POST(req: Request) {
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
    // TODO(phase-7): email the reset link containing `token`.
  }

  return json(generic);
}
