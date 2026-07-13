/**
 * Neon serverless Postgres client + Drizzle instance.
 *
 * Uses the HTTP driver (`neon-http`) — stateless, ideal for serverless Route
 * Handlers. `DATABASE_URL` is injected by the Vercel ↔ Neon integration.
 *
 * The instance is created lazily on first use so that merely importing this
 * module (e.g. during `next build`) never throws when the env var is absent.
 */
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let instance: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision Neon Postgres (Vercel Marketplace → Neon) so it is injected.",
    );
  }
  instance = drizzle(neon(url), { schema });
  return instance;
}

/** Lazy proxy — behaves exactly like the Drizzle instance, initialised on first access. */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
