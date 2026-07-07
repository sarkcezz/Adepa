/**
 * Seeds a fresh Neon database with enough data to exercise the app:
 * an admin, an employee, two customers, a spread of products, one published
 * stand announcement, one published event, and one active campaign.
 *
 * Idempotent: re-running skips rows that already exist (by natural key).
 * Run: `npm run db:seed:demo`.  Passwords come from env or safe defaults.
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

const hash = (pw: string) => bcrypt.hashSync(pw, 12);

async function main() {
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? "AdepaAdmin!2026";
  const staffPw = process.env.SEED_STAFF_PASSWORD ?? "AdepaStaff!2026";

  // ---- users -------------------------------------------------------------
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: "Adepa Admin",
      email: "admin@adepaporkhub.shop",
      phone: "0200000001",
      password: hash(adminPw),
      role: "admin",
      force_password_change: true,
    })
    .onConflictDoNothing({ target: schema.users.phone })
    .returning();

  const [employee] = await db
    .insert(schema.users)
    .values({
      name: "Kwame Mensah",
      email: "kwame@adepaporkhub.shop",
      phone: "0200000002",
      password: hash(staffPw),
      role: "employee",
      employee_id: "APH-0001",
      position: "Sales",
      force_password_change: true,
    })
    .onConflictDoNothing({ target: schema.users.phone })
    .returning();

  await db
    .insert(schema.users)
    .values([
      { name: "Ama Owusu", email: "ama@example.com", phone: "0244000010", password: hash("Customer!123"), role: "customer" },
      { name: "Yaw Boateng", email: "yaw@example.com", phone: "0244000011", password: hash("Customer!123"), role: "customer" },
    ])
    .onConflictDoNothing({ target: schema.users.phone });

  // Fall back to existing admin id when the insert was skipped.
  const adminId =
    admin?.id ??
    (await db.query.users.findFirst({ where: (u, { eq }) => eq(u.phone, "0200000001") }))!.id;

  // ---- products ----------------------------------------------------------
  await db
    .insert(schema.products)
    .values([
      { name: "Fresh Pork Shoulder", product_line: "RAW", variant: "NONE", weight_grams: 1000, price_kobo: 8500, description: "Butcher-cut fresh pork shoulder, ideal for stews and roasts.", stock_qty: 40, heat_level: 0 },
      { name: "Pork Belly Slab", product_line: "RAW", variant: "NONE", weight_grams: 800, price_kobo: 9200, description: "Rich, layered pork belly — crisp it or braise it.", stock_qty: 25, heat_level: 0 },
      { name: "Spiced Pork Sausage — Mild", product_line: "SPICED", variant: "MILD", weight_grams: 500, price_kobo: 6000, description: "House-spiced sausage with a gentle warmth.", ingredients: "Pork, salt, garlic, mild pepper", stock_qty: 60, heat_level: 1 },
      { name: "Spiced Pork Sausage — Spicy", product_line: "SPICED", variant: "SPICY", weight_grams: 500, price_kobo: 6000, description: "For the heat-seekers: scotch-bonnet forward.", ingredients: "Pork, salt, garlic, scotch bonnet", stock_qty: 45, heat_level: 3 },
      { name: "Ready Grilled Pork Platter", product_line: "READY_TO_EAT", variant: "MILD", weight_grams: 600, price_kobo: 12000, description: "Charcoal-grilled and ready to serve.", storage_instructions: "Keep refrigerated, consume within 2 days.", stock_qty: 20, heat_level: 2 },
      { name: "Ready Pork Kebabs (6pc)", product_line: "READY_TO_EAT", variant: "SPICY", weight_grams: 400, price_kobo: 9500, description: "Skewered, spiced, and grilled — grab and go.", stock_qty: 30, heat_level: 3 },
    ])
    .onConflictDoNothing();

  // ---- announcement ------------------------------------------------------
  await db
    .insert(schema.standAnnouncements)
    .values({
      title: "Weekend Stand — Osu Oxford Street",
      description: "Find our fresh cuts and grilled platters this weekend at Osu.",
      locations: [{ name: "Osu Oxford Street", lat: 5.5557, lng: -0.1829 }],
      start_date: "2026-07-01",
      end_date: "2026-12-31",
      is_published: true,
      created_by: adminId,
    })
    .onConflictDoNothing();

  // ---- event -------------------------------------------------------------
  await db
    .insert(schema.porkEvents)
    .values({
      name: "Adepa Pork Fest 2026",
      event_date: "2026-09-20",
      event_time: "12:00:00",
      venue_name: "Accra Polo Club",
      venue_address: "Airport Residential Area, Accra",
      flat_rate_kobo: 15000,
      capacity: 200,
      description: "An afternoon of grilled pork, music, and family fun.",
      status: "PUBLISHED",
      created_by: adminId,
    })
    .onConflictDoNothing();

  // ---- campaign ----------------------------------------------------------
  await db
    .insert(schema.campaigns)
    .values({
      name: "Welcome 10%",
      code: "WELCOME10",
      discount_type: "PERCENT",
      discount_value: 10,
      min_order_kobo: 5000,
      valid_from: new Date("2026-01-01"),
      valid_to: new Date("2026-12-31"),
      is_active: true,
    })
    .onConflictDoNothing({ target: schema.campaigns.code });

  console.log("✓ Seed complete.");
  console.log(`  Admin:    admin@adepaporkhub.shop / ${adminPw}${admin ? "" : "  (already existed — unchanged)"}`);
  console.log(`  Employee: APH-0001 / ${staffPw}${employee ? "" : "  (already existed — unchanged)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
