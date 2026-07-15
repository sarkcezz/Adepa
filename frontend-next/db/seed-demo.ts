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
      employee_id: "ADMIN",
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
      { name: "Fresh Pork Shoulder", product_line: "RAW", variant: "NONE", weight_grams: 1000, price_kobo: 8500, description: "Butcher-cut fresh pork shoulder, ideal for stews and roasts.", stock_qty: 40, heat_level: 0, category: "SHOULDER", nutrition_info: "Per 100g: ~250 kcal, 20g protein, 18g fat", cooking_tips: "Braise low and slow for 2-3 hours, or slow-roast for pulled pork." },
      { name: "Pork Belly Slab", product_line: "RAW", variant: "NONE", weight_grams: 800, price_kobo: 9200, description: "Rich, layered pork belly — crisp it or braise it.", stock_qty: 25, heat_level: 0, category: "PORK_BELLY", nutrition_info: "Per 100g: ~518 kcal, 9g protein, 53g fat", cooking_tips: "Score the skin and roast at high heat for crackling, or braise for melt-in-the-mouth texture." },
      { name: "Spiced Pork Sausage — Mild", product_line: "SPICED", variant: "MILD", weight_grams: 500, price_kobo: 6000, description: "House-spiced sausage with a gentle warmth.", ingredients: "Pork, salt, garlic, mild pepper", stock_qty: 60, heat_level: 1, category: "SAUSAGES", nutrition_info: "Per 100g: ~300 kcal, 14g protein, 25g fat", cooking_tips: "Pan-fry over medium heat, turning often, for 10-12 minutes until browned through." },
      { name: "Spiced Pork Sausage — Spicy", product_line: "SPICED", variant: "SPICY", weight_grams: 500, price_kobo: 6000, description: "For the heat-seekers: scotch-bonnet forward.", ingredients: "Pork, salt, garlic, scotch bonnet", stock_qty: 45, heat_level: 3, category: "SAUSAGES", nutrition_info: "Per 100g: ~300 kcal, 14g protein, 25g fat", cooking_tips: "Grill over medium-high heat for a smoky char, turning every few minutes." },
      { name: "Ready Grilled Pork Platter", product_line: "READY_TO_EAT", variant: "MILD", weight_grams: 600, price_kobo: 12000, description: "Charcoal-grilled and ready to serve.", storage_instructions: "Keep refrigerated, consume within 2 days.", stock_qty: 20, heat_level: 2, category: "FAMILY_PACK", cooking_tips: "Reheat covered in a 160°C oven for 10-12 minutes, or enjoy cold." },
      { name: "Ready Pork Kebabs (6pc)", product_line: "READY_TO_EAT", variant: "SPICY", weight_grams: 400, price_kobo: 9500, description: "Skewered, spiced, and grilled — grab and go.", stock_qty: 30, heat_level: 3, category: "BBQ_PACK", cooking_tips: "Best served warm — reheat on a grill or skillet for 3-4 minutes per side." },
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
      venue_name: "Kumasi Sports Stadium Grounds",
      venue_address: "Stadium Road, Kumasi",
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

  // ---- blog posts ---------------------------------------------------------
  await db
    .insert(schema.blogPosts)
    .values([
      {
        slug: "how-to-store-pork-safely",
        title: "How to Store Pork Safely at Home",
        excerpt: "Simple rules for fridge time, freezing, and thawing that keep your pork safe and fresh.",
        body: "Fresh pork should go straight into the fridge and be used within 2-3 days. If you won't cook it that soon, freeze it — well-wrapped pork keeps well for up to 6 months in the freezer.\n\nWhen you're ready to cook, thaw pork in the fridge overnight rather than at room temperature, which lets bacteria grow. Never refreeze raw pork that's already been thawed; if you have leftovers, cook them fully first, then you can freeze the cooked dish.\n\nAlways use a clean cutting board for raw pork, separate from vegetables and ready-to-eat food, and wash your hands and surfaces afterwards.",
        category: "Meat Storage",
        author_name: "Adepa Pork Hub",
      },
      {
        slug: "internal-temperature-guide",
        title: "The Right Internal Temperature for Cooked Pork",
        excerpt: "Modern pork is safe at 71°C — here's why you don't need to overcook it anymore.",
        body: "For years, home cooks were told to cook pork until it was grey all the way through. That advice is outdated. The safe internal temperature for pork is 71°C (160°F) for ground pork and sausages, or 63°C (145°F) with a 3-minute rest for whole cuts like chops and tenderloin.\n\nA meat thermometer is the only reliable way to check — colour alone can be misleading. Cooking to the right temperature (not beyond it) keeps your pork juicy instead of dry.\n\nFor slow-cooked cuts like pork belly or shoulder, you're aiming for tenderness rather than a specific temperature — around 90°C internal is typical for that fall-apart texture.",
        category: "Food Safety",
        author_name: "Adepa Pork Hub",
      },
      {
        slug: "why-protein-matters",
        title: "Why Pork Belongs in a Balanced Diet",
        excerpt: "A look at the protein, B vitamins, and minerals in lean pork cuts.",
        body: "Pork is one of the richest natural sources of thiamine (vitamin B1), which supports energy metabolism and nerve function. Lean cuts like tenderloin and loin chops are comparable to chicken breast in protein-to-fat ratio, while still delivering iron, zinc, and B12.\n\nPortion and preparation matter more than the meat itself — grilling, roasting, or stewing with vegetables makes pork part of a balanced plate, while deep-frying or heavy processing adds unnecessary fat and sodium.\n\nAt Adepa, we list nutrition info directly on product pages so you can plan meals with confidence.",
        category: "Nutrition",
        author_name: "Adepa Pork Hub",
      },
      {
        slug: "five-minute-pork-marinades",
        title: "Five Marinades You Can Make in 5 Minutes",
        excerpt: "Quick flavour combinations for grilling, pan-searing, or oven-roasting pork.",
        body: "1. Garlic-ginger-soy: soy sauce, grated ginger, minced garlic, a touch of honey.\n\n2. Suya spice: ground peanuts, chili flakes, ginger powder, a little oil.\n\n3. Citrus-herb: lime juice, chopped thyme, garlic, olive oil.\n\n4. Smoky paprika: smoked paprika, cumin, brown sugar, oil, salt.\n\n5. Pepper-tomato: blended tomato, scotch bonnet, onion, a pinch of curry powder.\n\nMarinate for at least 30 minutes for thin cuts like chops, or overnight for larger pieces like shoulder or belly. All five work well on the grill, in a pan, or in the oven.",
        category: "Cooking Tips",
        author_name: "Adepa Pork Hub",
      },
      {
        slug: "adepa-pork-fest-2026",
        title: "Join Us at Adepa Pork Fest 2026",
        excerpt: "Grilled pork, music, and family fun at the Kumasi Sports Stadium Grounds this September.",
        body: "We're hosting our first Adepa Pork Fest on 20 September 2026 at the Kumasi Sports Stadium Grounds — an afternoon of live grilling, music, and activities for the whole family.\n\nTickets include a flat-rate entry with food available to purchase on site. Registration is open now on our Events page, and spots are limited, so book early.\n\nWe'll also be running event-only promotions on the day, so bring your appetite.",
        category: "Events",
        author_name: "Adepa Pork Hub",
      },
    ])
    .onConflictDoNothing({ target: schema.blogPosts.slug });

  console.log("✓ Seed complete.");
  console.log(`  Admin:    admin@adepaporkhub.shop / ${adminPw}${admin ? "" : "  (already existed — unchanged)"}`);
  console.log(`  Employee: APH-0001 / ${staffPw}${employee ? "" : "  (already existed — unchanged)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
