import { fail } from "./http";

/**
 * Guard a cron route. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 * Returns null when authorized, or a 401 response otherwise.
 */
export function assertCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null; // not configured yet — allow (dev)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return null;
  return fail("Unauthorized.", 401);
}
