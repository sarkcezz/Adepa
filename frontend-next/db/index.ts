/**
 * Neon serverless Postgres client + Drizzle instance.
 *
 * Uses the HTTP driver (`neon-http`) — stateless, ideal for serverless Route
 * Handlers. `DATABASE_URL` is injected by the Vercel ↔ Neon integration.
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Provision Neon Postgres (Vercel Marketplace → Neon) so it is injected.",
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
