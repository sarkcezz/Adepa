import { inArray, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, campaigns, orders } from "@/db/schema";

/** Next order number: APH-000001, computed from the current max. */
export async function nextOrderNumber(): Promise<string> {
  const [row] = await db
    .select({
      max: sql<number>`COALESCE(MAX(CAST(SUBSTRING(${orders.order_number} FROM 5) AS INTEGER)), 0)`,
    })
    .from(orders)
    .where(like(orders.order_number, "APH-%"));
  const next = (row?.max ?? 0) + 1;
  return "APH-" + String(next).padStart(6, "0");
}

export const HOME_DELIVERY_FEE_KOBO = 1500;

type CampaignRow = typeof campaigns.$inferSelect;

/** Discount for a campaign against a subtotal (matches Laravel CampaignService). */
export function discountKobo(c: CampaignRow, subtotalKobo: number): number {
  switch (c.discount_type) {
    case "PERCENT":
      return Math.round(subtotalKobo * (c.discount_value / 100));
    case "FIXED":
      return Math.min(c.discount_value, subtotalKobo);
    default:
      return 0; // FREE_DELIVERY
  }
}

export interface CampaignCheck {
  valid: boolean;
  message: string;
  campaign?: CampaignRow;
  campaign_id?: string;
  discount_kobo?: number;
  free_delivery?: boolean;
}

/** Validate a promo code against a subtotal (+ optional product lines). */
export async function validateCampaign(
  code: string,
  subtotalKobo: number,
  productLines?: string[],
): Promise<CampaignCheck> {
  const [c] = await db
    .select()
    .from(campaigns)
    .where(sql`${campaigns.code} = ${code} AND ${campaigns.is_active} = true`)
    .limit(1);

  if (!c) return { valid: false, message: "Promo code not found." };

  const now = Date.now();
  if (now < c.valid_from.getTime() || now > c.valid_to.getTime()) {
    return { valid: false, message: "Promo code expired or not yet active." };
  }
  if (c.max_usage && c.usage_count >= c.max_usage) {
    return { valid: false, message: "Promo code has reached its usage limit." };
  }
  if (subtotalKobo < c.min_order_kobo) {
    return {
      valid: false,
      message: "Minimum order is GHS " + (c.min_order_kobo / 100).toFixed(2),
    };
  }
  const lines = c.applicable_lines as string[] | null;
  if (lines?.length && productLines?.length) {
    if (!lines.some((l) => productLines.includes(l))) {
      return { valid: false, message: "Promo not applicable to selected products." };
    }
  }

  return {
    valid: true,
    message: "Promo applied.",
    campaign: c,
    campaign_id: c.id,
    discount_kobo: discountKobo(c, subtotalKobo),
    free_delivery: c.discount_type === "FREE_DELIVERY",
  };
}

export type CartItem = { product_id: string; quantity: number; line_discount_kobo?: number };

/** Load products for a set of cart items, keyed by id. Throws if any missing. */
export async function loadCartProducts(items: CartItem[]) {
  const ids = [...new Set(items.map((i) => i.product_id))];
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((p) => [p.id, p]));
  for (const it of items) {
    if (!byId.has(it.product_id)) throw new Error(`Product ${it.product_id} not found.`);
  }
  return byId;
}
