/**
 * Applies pending Drizzle migrations to Neon. Run: `npm run db:migrate`.
 * Requires DATABASE_URL (injected by the Vercel ↔ Neon integration, or set
 * locally in .env.local).
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("✓ Migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
