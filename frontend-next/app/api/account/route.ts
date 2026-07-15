import { NextResponse } from "next/server";
import { and, eq, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard, toPublicUser } from "@/app/api/_lib/auth";

/** PUT /account — the signed-in user updates their own name/email/phone. */
export async function PUT(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{ name?: string; email?: string; phone?: string; birth_date?: string | null }>(req);
  const errors: Record<string, string[]> = {};
  if (!b.name?.trim()) errors.name = ["Name is required."];
  if (!b.phone?.trim()) errors.phone = ["Phone is required."];
  if (Object.keys(errors).length) return validationError(errors);

  const email = b.email?.trim().toLowerCase() || null;
  const phone = b.phone!.trim();
  const birthDate = b.birth_date?.trim() || null;

  const conflicts = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        ne(users.id, user.id),
        or(email ? eq(users.email, email) : undefined, eq(users.phone, phone)),
      ),
    )
    .limit(1);
  if (conflicts.length) {
    return validationError({ email: ["Another account already uses this email or phone."] });
  }

  const [updated] = await db
    .update(users)
    .set({ name: b.name!.trim(), email, phone, birth_date: birthDate, updated_at: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  if (!updated) return fail("Could not update profile.", 500);

  return json(toPublicUser(updated));
}
