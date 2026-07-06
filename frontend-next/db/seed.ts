/**
 * Seeds a fresh Neon database with enough data to exercise the app:
 * an admin, an employee, two customers, a spread of products, one published
 * stand announcement, one published event, and one active campaign.
 *
 * Idempotent: re-running skips rows that already exist (by natural key).
 * Run: `npm run db:seed`.  Passwords come from env or safe defaults.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

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
      forcePasswordChange: true,
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
      employeeId: "APH-0001",
      position: "Sales",
      forcePasswordChange: true,
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
      { name: "Fresh Pork Shoulder", productLine: "RAW", variant: "NONE", weightGrams: 1000, priceKobo: 8500, description: "Butcher-cut fresh pork shoulder, ideal for stews and roasts.", stockQty: 40, heatLevel: 0 },
      { name: "Pork Belly Slab", productLine: "RAW", variant: "NONE", weightGrams: 800, priceKobo: 9200, description: "Rich, layered pork belly — crisp it or braise it.", stockQty: 25, heatLevel: 0 },
      { name: "Spiced Pork Sausage — Mild", productLine: "SPICED", variant: "MILD", weightGrams: 500, priceKobo: 6000, description: "House-spiced sausage with a gentle warmth.", ingredients: "Pork, salt, garlic, mild pepper", stockQty: 60, heatLevel: 1 },
      { name: "Spiced Pork Sausage — Spicy", productLine: "SPICED", variant: "SPICY", weightGrams: 500, priceKobo: 6000, description: "For the heat-seekers: scotch-bonnet forward.", ingredients: "Pork, salt, garlic, scotch bonnet", stockQty: 45, heatLevel: 3 },
      { name: "Ready Grilled Pork Platter", productLine: "READY_TO_EAT", variant: "MILD", weightGrams: 600, priceKobo: 12000, description: "Charcoal-grilled and ready to serve.", storageInstructions: "Keep refrigerated, consume within 2 days.", stockQty: 20, heatLevel: 2 },
      { name: "Ready Pork Kebabs (6pc)", productLine: "READY_TO_EAT", variant: "SPICY", weightGrams: 400, priceKobo: 9500, description: "Skewered, spiced, and grilled — grab and go.", stockQty: 30, heatLevel: 3 },
    ])
    .onConflictDoNothing();

  // ---- announcement ------------------------------------------------------
  await db
    .insert(schema.standAnnouncements)
    .values({
      title: "Weekend Stand — Osu Oxford Street",
      description: "Find our fresh cuts and grilled platters this weekend at Osu.",
      locations: [{ name: "Osu Oxford Street", lat: 5.5557, lng: -0.1829 }],
      startDate: "2026-07-01",
      endDate: "2026-12-31",
      isPublished: true,
      createdBy: adminId,
    })
    .onConflictDoNothing();

  // ---- event -------------------------------------------------------------
  await db
    .insert(schema.porkEvents)
    .values({
      name: "Adepa Pork Fest 2026",
      eventDate: "2026-09-20",
      eventTime: "12:00:00",
      venueName: "Accra Polo Club",
      venueAddress: "Airport Residential Area, Accra",
      flatRateKobo: 15000,
      capacity: 200,
      description: "An afternoon of grilled pork, music, and family fun.",
      status: "PUBLISHED",
      createdBy: adminId,
    })
    .onConflictDoNothing();

  // ---- campaign ----------------------------------------------------------
  await db
    .insert(schema.campaigns)
    .values({
      name: "Welcome 10%",
      code: "WELCOME10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderKobo: 5000,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2026-12-31"),
      isActive: true,
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
