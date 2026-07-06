import bcrypt from "bcryptjs";
import { or, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { issueToken, toPublicUser } from "@/app/api/_lib/auth";

export async function POST(req: Request) {
  const b = await body<{ name?: string; email?: string; phone?: string; password?: string }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.trim()) errors.name = ["The name field is required."];
  if (!b.email?.trim()) errors.email = ["The email field is required."];
  if (!b.phone?.trim()) errors.phone = ["The phone field is required."];
  if (!b.password || b.password.length < 8) errors.password = ["The password must be at least 8 characters."];
  if (Object.keys(errors).length) return validationError(errors);

  const email = b.email!.trim().toLowerCase();
  const phone = b.phone!.trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.phone, phone)))
    .limit(1);
  if (existing.length) {
    return validationError({ email: ["An account with this email or phone already exists."] });
  }

  const [user] = await db
    .insert(users)
    .values({
      name: b.name!.trim(),
      email,
      phone,
      password: bcrypt.hashSync(b.password!, 12),
      role: "customer",
    })
    .returning();

  if (!user) return fail("Could not create account.", 500);

  const token = await issueToken(user.id);
  return json({ user: toPublicUser(user), token }, 201);
}
