/**
 * Bootstrap seed — creates ONLY the first admin account. Everything else
 * (products, staff, campaigns, events, announcements) is built through the
 * admin UI. This is the clean-launch path (no data migrated from MySQL).
 *
 * The admin is created with force_password_change = true, so the first login
 * routes to /change-password. Override the defaults via env:
 *   SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PHONE, SEED_ADMIN_PASSWORD
 *
 * Idempotent (skips if the phone already exists). Run: `npm run db:seed`.
 * For a populated demo dataset instead, use `npm run db:seed:demo`.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");
const db = drizzle(neon(url), { schema });

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? "Adepa Admin";
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@adepaporkhub.shop").toLowerCase();
  const phone = process.env.SEED_ADMIN_PHONE ?? "0200000001";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "AdepaAdmin!2026";

  const [admin] = await db
    .insert(schema.users)
    .values({
      name,
      email,
      phone,
      password: bcrypt.hashSync(password, 12),
      role: "admin",
      force_password_change: true,
    })
    .onConflictDoNothing({ target: schema.users.phone })
    .returning();

  console.log("✓ Bootstrap complete.");
  if (admin) {
    console.log(`  Admin created: ${email} / ${password}`);
    console.log("  You'll be prompted to change this password on first login.");
  } else {
    console.log(`  Admin ${phone} already exists — unchanged.`);
  }
  console.log("  Everything else is empty — build your catalog and staff in the admin UI.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
