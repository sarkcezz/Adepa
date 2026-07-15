export const dynamic = "force-dynamic";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleAuthUrl, googleConfigured, GOOGLE_STATE_COOKIE, GOOGLE_NEXT_COOKIE } from "@/app/api/_lib/google-oauth";

/** GET /auth/google — redirects to Google's consent screen. */
export async function GET(req: Request) {
  // Internal navigation back into our own app — use the request's own origin
  // (not the siteUrl() env fallback, which is only meant for link-building
  // outside a request, e.g. emails) so this works on any port/preview domain.
  const origin = new URL(req.url).origin;

  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const next = new URL(req.url).searchParams.get("next");
  const state = randomBytes(24).toString("hex");
  const jar = await cookies();
  jar.set(GOOGLE_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  if (next) jar.set(GOOGLE_NEXT_COOKIE, next, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });

  return NextResponse.redirect(googleAuthUrl(state));
}
