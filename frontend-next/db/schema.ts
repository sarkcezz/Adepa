/**
 * Postgres schema (Drizzle) — ported from the Laravel MySQL schema.
 *
 * Money is stored in integer pesewas (GHS × 100), matching the existing
 * frontend contract (`price_kobo`, `total_kobo`, …). UUID primary keys use
 * Postgres `gen_random_uuid()`. Enums map 1:1 to the Laravel enum columns.
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
    employeeId: varchar("employee_id", { length: 10 }).unique(), // APH-XXXX
    position: varchar("position", { length: 20 }),
    isActive: boolean("is_active").notNull().default(true),
    forcePasswordChange: boolean("force_password_change").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

/* --------------------------------------------------------- auth (tokens) */
/** Bearer tokens (mirrors Sanctum personal_access_tokens). Stored hashed. */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), // sha256 hex
    name: varchar("name", { length: 100 }).notNull().default("api"),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  email: varchar("email", { length: 255 }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at"),
});

/* -------------------------------------------------------------- addresses */
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull().default("Home"),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  area: varchar("area", { length: 255 }).notNull(),
  district: varchar("district", { length: 255 }).notNull(),
  landmark: text("landmark"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* --------------------------------------------------------------- products */
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    productLine: productLineEnum("product_line").notNull(),
    variant: variantEnum("variant").notNull().default("NONE"),
    weightGrams: integer("weight_grams"),
    priceKobo: integer("price_kobo").notNull(),
    description: text("description").notNull(),
    ingredients: text("ingredients"),
    storageInstructions: text("storage_instructions"),
    heatLevel: smallint("heat_level").notNull().default(0),
    imageUrl: varchar("image_url", { length: 500 }),
    stockQty: integer("stock_qty").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_line_variant_idx").on(t.productLine, t.variant),
    index("products_active_idx").on(t.isActive),
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
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("announcements_dates_idx").on(t.startDate, t.endDate),
    index("announcements_published_idx").on(t.isPublished),
  ],
);

/* ------------------------------------------------------------ pork events */
export const porkEvents = pgTable(
  "pork_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    eventDate: date("event_date").notNull(),
    eventTime: time("event_time").notNull(),
    venueName: varchar("venue_name", { length: 255 }).notNull(),
    venueAddress: text("venue_address").notNull(),
    flatRateKobo: integer("flat_rate_kobo").notNull(),
    capacity: integer("capacity").notNull(),
    registeredCount: integer("registered_count").notNull().default(0),
    description: text("description").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    status: eventStatusEnum("status").notNull().default("DRAFT"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("events_date_status_idx").on(t.eventDate, t.status)],
);

/* -------------------------------------------------------------- campaigns */
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    minOrderKobo: integer("min_order_kobo").notNull().default(0),
    maxUsage: integer("max_usage"),
    usageCount: integer("usage_count").notNull().default(0),
    validFrom: timestamp("valid_from").notNull(),
    validTo: timestamp("valid_to").notNull(),
    applicableLines: jsonb("applicable_lines"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("campaigns_validity_idx").on(t.validFrom, t.validTo),
    index("campaigns_active_idx").on(t.isActive),
  ],
);

/* ----------------------------------------------------------------- orders */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
    customerId: uuid("customer_id").notNull().references(() => users.id),
    employeeId: uuid("employee_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
    addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
    eventId: uuid("event_id").references(() => porkEvents.id, { onDelete: "set null" }),
    pickupLocationName: varchar("pickup_location_name", { length: 255 }),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    deliveryFeeKobo: integer("delivery_fee_kobo").notNull().default(0),
    discountKobo: integer("discount_kobo").notNull().default(0),
    totalKobo: integer("total_kobo").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("MOMO"),
    paymentReference: varchar("payment_reference", { length: 255 }),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    paystackReference: varchar("paystack_reference", { length: 255 }),
    source: orderSourceEnum("source").notNull().default("ONLINE"),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_payment_status_idx").on(t.paymentStatus),
    index("orders_customer_idx").on(t.customerId),
    index("orders_employee_source_idx").on(t.employeeId, t.source),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productVariant: varchar("product_variant", { length: 50 }),
  weightGrams: integer("weight_grams"),
  quantity: integer("quantity").notNull(),
  unitPriceKobo: integer("unit_price_kobo").notNull(),
  subtotalKobo: integer("subtotal_kobo").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* --------------------------------------------------- event registrations */
export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => porkEvents.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    paystackReference: varchar("paystack_reference", { length: 255 }),
    checkedIn: boolean("checked_in").notNull().default(false),
    checkedInAt: timestamp("checked_in_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("event_reg_unique").on(t.eventId, t.customerId)],
);

export const campaignUsages = pgTable("campaign_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  discountAppliedKobo: integer("discount_applied_kobo").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------------------------------------------------------- notifications */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_read_idx").on(t.isRead)],
);

/* ------------------------------------------------------------- audit logs */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    userName: varchar("user_name", { length: 255 }),
    userRole: varchar("user_role", { length: 20 }),
    action: varchar("action", { length: 60 }).notNull(),
    subjectType: varchar("subject_type", { length: 80 }),
    subjectId: uuid("subject_id"),
    subjectLabel: varchar("subject_label", { length: 255 }),
    changes: jsonb("changes"),
    note: text("note"),
    ip: varchar("ip", { length: 45 }),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_user_idx").on(t.userId),
    index("audit_action_idx").on(t.action),
    index("audit_subject_idx").on(t.subjectType, t.subjectId),
    index("audit_created_idx").on(t.createdAt),
  ],
);
