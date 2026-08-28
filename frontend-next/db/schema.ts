/**
 * Postgres schema (Drizzle) — ported from the Laravel MySQL schema.
 *
 * Property names are snake_case on purpose: the frontend was built against the
 * Laravel API's snake_case JSON (`product_line`, `price_kobo`, …), so naming
 * the Drizzle fields to match lets Route Handlers return rows directly with no
 * per-field remapping. Money is integer pesewas (GHS × 100). UUID PKs use
 * Postgres `gen_random_uuid()`.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  boolean,
  jsonb,
  date,
  time,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */
export const roleEnum = pgEnum("role", ["customer", "admin", "employee"]);
export const productLineEnum = pgEnum("product_line", ["RAW", "SPICED", "READY_TO_EAT"]);
export const variantEnum = pgEnum("variant", ["PLAIN", "MILD", "SPICY", "NONE"]);
export const eventStatusEnum = pgEnum("event_status", ["DRAFT", "PUBLISHED", "CANCELLED"]);
export const discountTypeEnum = pgEnum("discount_type", ["PERCENT", "FIXED", "FREE_DELIVERY"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["HOME", "PICKUP", "EVENT"]);
export const paymentMethodEnum = pgEnum("payment_method", ["MOMO", "CARD", "CASH", "BANK"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "FAILED"]);
export const orderSourceEnum = pgEnum("order_source", ["ONLINE", "EMPLOYEE_SALE"]);
export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", ["WEEKLY", "BIWEEKLY", "MONTHLY"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "PAUSED", "CANCELLED"]);

/* ------------------------------------------------------------------ users */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("customer"),
    employee_id: varchar("employee_id", { length: 10 }).unique(), // APH-XXXX
    position: varchar("position", { length: 20 }),
    is_active: boolean("is_active").notNull().default(true),
    force_password_change: boolean("force_password_change").notNull().default(false),
    is_guest: boolean("is_guest").notNull().default(false),
    google_id: varchar("google_id", { length: 255 }).unique(),
    birth_date: date("birth_date"),
    referral_code: varchar("referral_code", { length: 20 }).unique(),
    referred_by_user_id: uuid("referred_by_user_id"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

/* --------------------------------------------------------- auth (tokens) */
/** Bearer tokens (mirrors Sanctum personal_access_tokens). Stored hashed. */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token_hash: varchar("token_hash", { length: 64 }).notNull().unique(), // sha256 hex
    name: varchar("name", { length: 100 }).notNull().default("api"),
    last_used_at: timestamp("last_used_at"),
    expires_at: timestamp("expires_at"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.user_id)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  email: varchar("email", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  created_at: timestamp("created_at"),
});

/* -------------------------------------------------------------- addresses */
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull().default("Home"),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  area: varchar("area", { length: 255 }).notNull(),
  district: varchar("district", { length: 255 }).notNull(),
  landmark: text("landmark"),
  is_default: boolean("is_default").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

/* --------------------------------------------------------------- products */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    product_line: productLineEnum("product_line").notNull(),
    variant: variantEnum("variant").notNull().default("NONE"),
    weight_grams: integer("weight_grams"),
    price_kobo: integer("price_kobo").notNull(),
    description: text("description").notNull(),
    ingredients: text("ingredients"),
    storage_instructions: text("storage_instructions"),
    heat_level: smallint("heat_level").notNull().default(0),
    image_url: varchar("image_url", { length: 500 }),
    gallery_urls: jsonb("gallery_urls"),
    /** Cut-based shop taxonomy (e.g. "PORK_CHOPS", "RIBS", "FAMILY_PACK") — a
     *  descriptive facet layered on top of product_line/variant, which remain
     *  the source of truth for cart, staff POS, and campaign logic. */
    category: varchar("category", { length: 40 }),
    nutrition_info: text("nutrition_info"),
    cooking_tips: text("cooking_tips"),
    stock_qty: integer("stock_qty").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_line_variant_idx").on(t.product_line, t.variant),
    index("products_active_idx").on(t.is_active),
  ],
);

/* --------------------------------------------------- stand announcements */
export const standAnnouncements = pgTable(
  "stand_announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    locations: jsonb("locations").notNull(),
    start_date: date("start_date").notNull(),
    end_date: date("end_date").notNull(),
    is_published: boolean("is_published").notNull().default(false),
    created_by: uuid("created_by").notNull().references(() => users.id),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("announcements_dates_idx").on(t.start_date, t.end_date),
    index("announcements_published_idx").on(t.is_published),
  ],
);

/* ------------------------------------------------------------ pork events */
export const porkEvents = pgTable(
  "pork_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    event_date: date("event_date").notNull(),
    event_time: time("event_time").notNull(),
    venue_name: varchar("venue_name", { length: 255 }).notNull(),
    venue_address: text("venue_address").notNull(),
    flat_rate_kobo: integer("flat_rate_kobo").notNull(),
    capacity: integer("capacity").notNull(),
    registered_count: integer("registered_count").notNull().default(0),
    description: text("description").notNull(),
    image_url: varchar("image_url", { length: 500 }),
    status: eventStatusEnum("status").notNull().default("DRAFT"),
    created_by: uuid("created_by").notNull().references(() => users.id),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("events_date_status_idx").on(t.event_date, t.status)],
);

/* -------------------------------------------------------------- campaigns */
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    discount_type: discountTypeEnum("discount_type").notNull(),
    discount_value: integer("discount_value").notNull(),
    min_order_kobo: integer("min_order_kobo").notNull().default(0),
    max_usage: integer("max_usage"),
    usage_count: integer("usage_count").notNull().default(0),
    valid_from: timestamp("valid_from").notNull(),
    valid_to: timestamp("valid_to").notNull(),
    applicable_lines: jsonb("applicable_lines"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("campaigns_validity_idx").on(t.valid_from, t.valid_to),
    index("campaigns_active_idx").on(t.is_active),
  ],
);

/* ----------------------------------------------------------------- orders */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    order_number: varchar("order_number", { length: 20 }).notNull().unique(),
    customer_id: uuid("customer_id").notNull().references(() => users.id),
    employee_id: uuid("employee_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    delivery_method: deliveryMethodEnum("delivery_method").notNull(),
    address_id: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
    event_id: uuid("event_id").references(() => porkEvents.id, { onDelete: "set null" }),
    pickup_location_name: varchar("pickup_location_name", { length: 255 }),
    subtotal_kobo: integer("subtotal_kobo").notNull(),
    delivery_fee_kobo: integer("delivery_fee_kobo").notNull().default(0),
    discount_kobo: integer("discount_kobo").notNull().default(0),
    total_kobo: integer("total_kobo").notNull(),
    payment_method: paymentMethodEnum("payment_method").notNull().default("MOMO"),
    payment_reference: varchar("payment_reference", { length: 255 }),
    payment_status: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    paystack_reference: varchar("paystack_reference", { length: 255 }).unique(),
    source: orderSourceEnum("source").notNull().default("ONLINE"),
    campaign_id: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    gift_card_id: uuid("gift_card_id"),
    gift_card_kobo: integer("gift_card_kobo").notNull().default(0),
    loyalty_points_redeemed: integer("loyalty_points_redeemed").notNull().default(0),
    loyalty_kobo: integer("loyalty_kobo").notNull().default(0),
    notes: text("notes"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_payment_status_idx").on(t.payment_status),
    index("orders_customer_idx").on(t.customer_id),
    index("orders_employee_source_idx").on(t.employee_id, t.source),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  product_id: uuid("product_id").notNull().references(() => products.id),
  product_name: varchar("product_name", { length: 255 }).notNull(),
  product_variant: varchar("product_variant", { length: 50 }),
  weight_grams: integer("weight_grams"),
  quantity: integer("quantity").notNull(),
  unit_price_kobo: integer("unit_price_kobo").notNull(),
  subtotal_kobo: integer("subtotal_kobo").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  changed_by: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* --------------------------------------------------- event registrations */
export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    event_id: uuid("event_id").notNull().references(() => porkEvents.id, { onDelete: "cascade" }),
    customer_id: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    payment_status: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    paystack_reference: varchar("paystack_reference", { length: 255 }),
    checked_in: boolean("checked_in").notNull().default(false),
    checked_in_at: timestamp("checked_in_at"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("event_reg_unique").on(t.event_id, t.customer_id)],
);

export const campaignUsages = pgTable("campaign_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaign_id: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  customer_id: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  discount_applied_kobo: integer("discount_applied_kobo").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------- notifications */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    is_read: boolean("is_read").notNull().default(false),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_read_idx").on(t.is_read)],
);

/* ------------------------------------------------------------------ wishlists */
export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("wishlist_unique").on(t.user_id, t.product_id)],
);

/* --------------------------------------------------------------- reviews */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_id: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    order_id: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: smallint("rating").notNull(),
    comment: text("comment"),
    photos: jsonb("photos"),
    is_approved: boolean("is_approved").notNull().default(true),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("reviews_product_idx").on(t.product_id),
    uniqueIndex("reviews_product_user_unique").on(t.product_id, t.user_id),
  ],
);

/* --------------------------------------------------------- loyalty ledger */
export const loyaltyLedger = pgTable(
  "loyalty_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    reason: varchar("reason", { length: 40 }).notNull(),
    order_id: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    note: text("note"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("loyalty_user_idx").on(t.user_id)],
);

/* ------------------------------------------------------------ subscriptions */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    items: jsonb("items").notNull(),
    frequency: subscriptionFrequencyEnum("frequency").notNull(),
    delivery_method: deliveryMethodEnum("delivery_method").notNull().default("HOME"),
    address_id: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
    status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
    next_delivery_date: date("next_delivery_date").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("subscriptions_user_idx").on(t.user_id), index("subscriptions_status_idx").on(t.status)],
);

/* -------------------------------------------------------------- gift cards */
export const giftCards = pgTable("gift_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  initial_balance_kobo: integer("initial_balance_kobo").notNull(),
  balance_kobo: integer("balance_kobo").notNull(),
  purchased_by: uuid("purchased_by").references(() => users.id, { onDelete: "set null" }),
  recipient_name: varchar("recipient_name", { length: 255 }),
  recipient_email: varchar("recipient_email", { length: 255 }),
  message: text("message"),
  is_active: boolean("is_active").notNull().default(true),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------- blog posts */
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    cover_image_url: varchar("cover_image_url", { length: 500 }),
    author_name: varchar("author_name", { length: 255 }).notNull().default("Adepa Pork Hub"),
    is_published: boolean("is_published").notNull().default(true),
    published_at: timestamp("published_at").notNull().defaultNow(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("blog_published_idx").on(t.is_published, t.published_at)],
);

/* ------------------------------------------------------ newsletter signups */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  is_active: boolean("is_active").notNull().default(true),
  subscribed_at: timestamp("subscribed_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------- contact form */
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------- wholesale leads */
export const wholesaleInquiries = pgTable("wholesale_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_name: varchar("business_name", { length: 255 }).notNull(),
  contact_name: varchar("contact_name", { length: 255 }).notNull(),
  business_type: varchar("business_type", { length: 60 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  estimated_volume: varchar("estimated_volume", { length: 100 }),
  message: text("message"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------- audit logs */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id"),
    user_name: varchar("user_name", { length: 255 }),
    user_role: varchar("user_role", { length: 20 }),
    action: varchar("action", { length: 60 }).notNull(),
    subject_type: varchar("subject_type", { length: 80 }),
    subject_id: uuid("subject_id"),
    subject_label: varchar("subject_label", { length: 255 }),
    changes: jsonb("changes"),
    note: text("note"),
    ip: varchar("ip", { length: 45 }),
    user_agent: varchar("user_agent", { length: 255 }),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_user_idx").on(t.user_id),
    index("audit_action_idx").on(t.action),
    index("audit_subject_idx").on(t.subject_type, t.subject_id),
    index("audit_created_idx").on(t.created_at),
  ],
);
