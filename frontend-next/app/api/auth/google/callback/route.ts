export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { issueToken } from "@/app/api/_lib/auth";
import { fetchGoogleProfile, GOOGLE_STATE_COOKIE, GOOGLE_NEXT_COOKIE } from "@/app/api/_lib/google-oauth";

/** GET /auth/google/callback — Google redirects here after the consent screen. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Internal navigation back into our own app — use the request's own
  // origin so this works on any port/preview domain (googleRedirectUri()
  // is the one place that must stay pinned to a stable, pre-registered URL).
  const origin = url.origin;
  const fail = (reason: string) => NextResponse.redirect(`${origin}/login?error=${reason}`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get(GOOGLE_STATE_COOKIE)?.value;
  const next = jar.get(GOOGLE_NEXT_COOKIE)?.value;
  jar.delete(GOOGLE_STATE_COOKIE);
  jar.delete(GOOGLE_NEXT_COOKIE);

  if (googleError) return fail("google_cancelled");
  if (!code || !state || !expectedState || state !== expectedState) return fail("google_failed");

  let profile;
  try {
    profile = await fetchGoogleProfile(code);
  } catch {
    return fail("google_failed");
  }
  if (!profile.email_verified) return fail("google_unverified");

  const email = profile.email.trim().toLowerCase();

  const [byGoogleId] = await db.select().from(users).where(eq(users.google_id, profile.sub)).limit(1);
  let user = byGoogleId;

  if (!user) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (byEmail) {
      // Staff/admin credentials are issued and controlled by the business,
      // not self-service — Google sign-in only ever authenticates customers.
      if (byEmail.role !== "customer") return fail("google_staff_email");

      [user] = await db
        .update(users)
        .set({ google_id: profile.sub, is_guest: false, updated_at: new Date() })
        .where(eq(users.id, byEmail.id))
        .returning();
    } else {
      [user] = await db
        .insert(users)
        .values({
          name: profile.name || email.split("@")[0],
          email,
          phone: `g${profile.sub}`.slice(0, 20),
          password: bcrypt.hashSync(randomBytes(32).toString("hex"), 12),
          role: "customer",
          google_id: profile.sub,
        })
        .returning();
    }
  }

  if (!user || !user.is_active) return fail("google_failed");

  const token = await issueToken(user.id, "google");
  const hash = next ? `token=${token}&next=${encodeURIComponent(next)}` : `token=${token}`;
  return NextResponse.redirect(`${origin}/login/callback#${hash}`);
}
