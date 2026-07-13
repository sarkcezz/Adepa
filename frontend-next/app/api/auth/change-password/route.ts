import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";

/** POST /auth/change-password — signed-in user updates their password. */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{
    current_password?: string;
    new_password?: string;
    new_password_confirmation?: string;
  }>(req);

  const errors: Record<string, string[]> = {};
  if (!b.current_password) errors.current_password = ["Current password is required."];
  if (!b.new_password || b.new_password.length < 8) errors.new_password = ["New password must be at least 8 characters."];
  if (b.new_password !== b.new_password_confirmation) errors.new_password = ["Passwords do not match."];
  if (Object.keys(errors).length) return validationError(errors);

  if (!bcrypt.compareSync(b.current_password!, user.password)) {
    return fail("Your current password is incorrect.", 422);
  }

  const [updated] = await db
    .update(users)
    .set({
      password: bcrypt.hashSync(b.new_password!, 12),
      force_password_change: false,
      updated_at: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return json({ message: "Password updated.", user: toPublicUser(updated) });
}
