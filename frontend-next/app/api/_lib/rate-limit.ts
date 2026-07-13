/**
 * Lightweight fixed-window rate limiter, in-memory per serverless instance.
 *
 * This is defense-in-depth, not a hard guarantee: Vercel functions are
 * stateless across cold starts and regions, so a determined attacker
 * distributed across many invocations isn't fully stopped. It does stop
 * casual/scripted brute-forcing from a single source, which is the realistic
 * threat for a small storefront. For a durable, cross-instance limit, swap
 * this for Upstash Redis (Vercel Marketplace) — same call signature.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Trim occasionally so the map doesn't grow unbounded on a long-lived instance.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  bucket.count++;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** Client IP from Vercel's forwarded header, falling back to a constant for local dev. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
