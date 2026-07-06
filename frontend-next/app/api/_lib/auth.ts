import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, authTokens } from "@/db/schema";

/** Public user shape returned to clients — never includes the password. */
export type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: "customer" | "admin" | "employee";
  employee_id: string | null;
  position: string | null;
  is_active: boolean;
  force_password_change: boolean;
};

type UserRow = typeof users.$inferSelect;

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    employee_id: u.employee_id,
    position: u.position,
    is_active: u.is_active,
    force_password_change: u.force_password_change,
  };
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Issue a bearer token for a user. The raw token is returned once (to the
 * client); only its sha256 hash is stored, mirroring Sanctum.
 */
export async function issueToken(userId: string, name = "api"): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await db.insert(authTokens).values({ user_id: userId, token_hash: sha256(raw), name });
  return raw;
}

/** Extract the bearer token from the Authorization header. */
export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Resolve the authenticated user from the request's bearer token.
 * Returns null when there is no valid, unexpired token for an active user.
 */
export async function authenticate(req: Request): Promise<UserRow | null> {
  const raw = bearer(req);
  if (!raw) return null;

  const [tok] = await db
    .select()
    .from(authTokens)
    .where(eq(authTokens.token_hash, sha256(raw)))
    .limit(1);
  if (!tok) return null;
  if (tok.expires_at && tok.expires_at.getTime() < Date.now()) return null;

  const [user] = await db.select().from(users).where(eq(users.id, tok.user_id)).limit(1);
  if (!user || !user.is_active) return null;

  // best-effort last-used stamp; don't block the request on it
  void db
    .update(authTokens)
    .set({ last_used_at: new Date() })
    .where(eq(authTokens.id, tok.id));

  return user;
}

/** Revoke a single bearer token (logout). */
export async function revokeToken(req: Request): Promise<void> {
  const raw = bearer(req);
  if (!raw) return;
  await db.delete(authTokens).where(eq(authTokens.token_hash, sha256(raw)));
}
