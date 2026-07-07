/**
 * Phase 2 — copy production data from the legacy Laravel MySQL database into
 * Neon Postgres.
 *
 *   SOURCE_MYSQL_URL=mysql://user:pass@host:3306/dbname npm run db:import
 *
 * Reads each table from MySQL and inserts into Neon in FK-safe order, applying
 * MySQL→Postgres conversions (tinyint→boolean, JSON strings→jsonb, date/time
 * formatting). User password hashes carry over unchanged, so existing accounts
 * keep their passwords. Idempotent inserts (onConflictDoNothing on the primary
 * key). By default it TRUNCATEs the target tables first (override with
 * --no-truncate). auth_tokens / password_reset_tokens are intentionally skipped.
 */
import { config } from "dotenv";
import mysql from "mysql2/promise";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

config({ path: ".env.local" });

const SOURCE = process.env.SOURCE_MYSQL_URL;
const TARGET = process.env.DATABASE_URL;
const TRUNCATE = !process.argv.includes("--no-truncate");

if (!SOURCE) throw new Error("SOURCE_MYSQL_URL is not set (the legacy MySQL connection).");
if (!TARGET) throw new Error("DATABASE_URL is not set (the Neon connection).");

const db = drizzle(neon(TARGET), { schema });

/* helpers ------------------------------------------------------------------ */
const bool = (v: unknown) => v === 1 || v === true || v === "1";
const jsonb = (v: unknown) => {
  if (v == null) return null;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return v; } }
  return v;
};
const dateOnly = (v: unknown) => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};
const timeOnly = (v: unknown) => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(11, 19);
  return String(v).slice(0, 8);
};
const ts = (v: unknown) => (v == null ? null : v instanceof Date ? v : new Date(String(v)));

/* table copy plan (parents first) ----------------------------------------- */
type Row = Record<string, unknown>;
interface Step { source: string; target: any; map: (r: Row) => Row; }

const PLAN: Step[] = [
  { source: "users", target: schema.users, map: (r) => ({
      id: r.id, name: r.name, email: r.email ?? null, phone: r.phone, password: r.password,
      role: r.role, employee_id: r.employee_id ?? null, position: r.position ?? null,
      is_active: bool(r.is_active), force_password_change: bool(r.force_password_change),
      created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "addresses", target: schema.addresses, map: (r) => ({
      id: r.id, user_id: r.user_id, label: r.label, recipient: r.recipient, phone: r.phone,
      area: r.area, district: r.district, landmark: r.landmark ?? null, is_default: bool(r.is_default),
      created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "products", target: schema.products, map: (r) => ({
      id: r.id, name: r.name, product_line: r.product_line, variant: r.variant ?? "NONE",
      weight_grams: r.weight_grams ?? null, price_kobo: r.price_kobo, description: r.description,
      ingredients: r.ingredients ?? null, storage_instructions: r.storage_instructions ?? null,
      heat_level: r.heat_level ?? 0, image_url: r.image_url ?? null, stock_qty: r.stock_qty ?? 0,
      is_active: bool(r.is_active), created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "campaigns", target: schema.campaigns, map: (r) => ({
      id: r.id, name: r.name, code: r.code, discount_type: r.discount_type, discount_value: r.discount_value,
      min_order_kobo: r.min_order_kobo ?? 0, max_usage: r.max_usage ?? null, usage_count: r.usage_count ?? 0,
      valid_from: ts(r.valid_from)!, valid_to: ts(r.valid_to)!, applicable_lines: jsonb(r.applicable_lines),
      is_active: bool(r.is_active), created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "pork_events", target: schema.porkEvents, map: (r) => ({
      id: r.id, name: r.name, event_date: dateOnly(r.event_date)!, event_time: timeOnly(r.event_time)!,
      venue_name: r.venue_name, venue_address: r.venue_address, flat_rate_kobo: r.flat_rate_kobo,
      capacity: r.capacity, registered_count: r.registered_count ?? 0, description: r.description,
      image_url: r.image_url ?? null, status: r.status ?? "DRAFT", created_by: r.created_by,
      created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "stand_announcements", target: schema.standAnnouncements, map: (r) => ({
      id: r.id, title: r.title, description: r.description, locations: jsonb(r.locations) ?? [],
      start_date: dateOnly(r.start_date)!, end_date: dateOnly(r.end_date)!, is_published: bool(r.is_published),
      created_by: r.created_by, created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "orders", target: schema.orders, map: (r) => ({
      id: r.id, order_number: r.order_number, customer_id: r.customer_id, employee_id: r.employee_id ?? null,
      status: r.status, delivery_method: r.delivery_method, address_id: r.address_id ?? null,
      event_id: r.event_id ?? null, pickup_location_name: r.pickup_location_name ?? null,
      subtotal_kobo: r.subtotal_kobo, delivery_fee_kobo: r.delivery_fee_kobo ?? 0, discount_kobo: r.discount_kobo ?? 0,
      total_kobo: r.total_kobo, payment_method: r.payment_method ?? "MOMO", payment_reference: r.payment_reference ?? null,
      payment_status: r.payment_status ?? "PENDING", paystack_reference: r.paystack_reference ?? null,
      source: r.source ?? "ONLINE", campaign_id: r.campaign_id ?? null, notes: r.notes ?? null,
      created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "order_items", target: schema.orderItems, map: (r) => ({
      id: r.id, order_id: r.order_id, product_id: r.product_id, product_name: r.product_name,
      product_variant: r.product_variant ?? null, weight_grams: r.weight_grams ?? null, quantity: r.quantity,
      unit_price_kobo: r.unit_price_kobo, subtotal_kobo: r.subtotal_kobo,
      created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "order_status_history", target: schema.orderStatusHistory, map: (r) => ({
      id: r.id, order_id: r.order_id, status: r.status, changed_by: r.changed_by ?? null,
      note: r.note ?? null, created_at: ts(r.created_at) ?? new Date(),
    }) },
  { source: "event_registrations", target: schema.eventRegistrations, map: (r) => ({
      id: r.id, event_id: r.event_id, customer_id: r.customer_id, payment_status: r.payment_status ?? "PENDING",
      paystack_reference: r.paystack_reference ?? null, checked_in: bool(r.checked_in),
      checked_in_at: ts(r.checked_in_at), created_at: ts(r.created_at) ?? new Date(), updated_at: ts(r.updated_at) ?? new Date(),
    }) },
  { source: "campaign_usages", target: schema.campaignUsages, map: (r) => ({
      id: r.id, campaign_id: r.campaign_id, order_id: r.order_id, customer_id: r.customer_id,
      discount_applied_kobo: r.discount_applied_kobo, created_at: ts(r.created_at) ?? new Date(),
    }) },
  { source: "notifications", target: schema.notifications, map: (r) => ({
      id: r.id, user_id: r.user_id, type: r.type, title: r.title, message: r.message,
      is_read: bool(r.is_read), created_at: ts(r.created_at) ?? new Date(),
    }) },
  { source: "audit_logs", target: schema.auditLogs, map: (r) => ({
      id: r.id, user_id: r.user_id ?? null, user_name: r.user_name ?? null, user_role: r.user_role ?? null,
      action: r.action, subject_type: r.subject_type ?? null, subject_id: r.subject_id ?? null,
      subject_label: r.subject_label ?? null, changes: jsonb(r.changes), note: r.note ?? null,
      ip: r.ip ?? null, user_agent: r.user_agent ?? null, created_at: ts(r.created_at) ?? new Date(),
    }) },
];

async function main() {
  const src = await mysql.createConnection(SOURCE!);
  console.log("Connected to source MySQL.");

  if (TRUNCATE) {
    // Physical Postgres table names, in the copy plan's order (CASCADE handles FKs).
    const tables = PLAN.map((s) => `"${s.source}"`);
    await db.execute(sql.raw(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`));
    console.log(`Truncated ${tables.length} target tables.`);
  }

  for (const step of PLAN) {
    let rows: Row[] = [];
    try {
      const [res] = await src.query(`SELECT * FROM \`${step.source}\``);
      rows = res as Row[];
    } catch {
      console.log(`· ${step.source}: not found in source, skipped`);
      continue;
    }
    if (!rows.length) { console.log(`· ${step.source}: 0 rows`); continue; }

    const mapped = rows.map(step.map);
    // insert in batches of 500
    for (let i = 0; i < mapped.length; i += 500) {
      await db.insert(step.target).values(mapped.slice(i, i + 500)).onConflictDoNothing();
    }
    console.log(`✓ ${step.source}: ${mapped.length} rows`);
  }

  await src.end();
  console.log("✓ Import complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
