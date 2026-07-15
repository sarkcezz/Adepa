export const dynamic = "force-dynamic";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { body, json, validationError } from "@/app/api/_lib/http";
import { rateLimit, clientIp } from "@/app/api/_lib/rate-limit";

/** POST /newsletter { email } — subscribe (idempotent). */
export async function POST(req: Request) {
  const limit = rateLimit(`newsletter:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limit.allowed) return validationError({ email: [`Too many attempts. Try again in ${limit.retryAfterSec}s.`] });

  const b = await body<{ email?: string }>(req);
  const email = b.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) return validationError({ email: ["A valid email is required."] });

  await db
    .insert(newsletterSubscribers)
    .values({ email })
    .onConflictDoUpdate({ target: newsletterSubscribers.email, set: { is_active: true } });

  return json({ ok: true }, 201);
}
