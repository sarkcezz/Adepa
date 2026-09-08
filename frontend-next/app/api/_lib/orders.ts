import { and, eq, inArray, like, sql } from "drizzle-orm";
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

/** Shared eligibility check: validity window, usage cap, minimum order, product-line scoping. */
function checkEligibility(c: CampaignRow, subtotalKobo: number, productLines?: string[]): { ok: true } | { ok: false; message: string } {
  const now = Date.now();
  if (now < c.valid_from.getTime() || now > c.valid_to.getTime()) {
    return { ok: false, message: "Promo code expired or not yet active." };
  }
  if (c.max_usage && c.usage_count >= c.max_usage) {
    return { ok: false, message: "Promo code has reached its usage limit." };
  }
  if (subtotalKobo < c.min_order_kobo) {
    return { ok: false, message: "Minimum order is GHS " + (c.min_order_kobo / 100).toFixed(2) };
  }
  const lines = c.applicable_lines as string[] | null;
  if (lines?.length && productLines?.length && !lines.some((l) => productLines.includes(l))) {
    return { ok: false, message: "Promo not applicable to selected products." };
  }
  return { ok: true };
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

  const eligibility = checkEligibility(c, subtotalKobo, productLines);
  if (!eligibility.ok) return { valid: false, message: eligibility.message };

  return {
    valid: true,
    message: "Promo applied.",
    campaign: c,
    campaign_id: c.id,
    discount_kobo: discountKobo(c, subtotalKobo),
    free_delivery: c.discount_type === "FREE_DELIVERY",
  };
}

/**
 * Bulk-purchase discounts: the best (largest discount) active, currently-valid
 * auto_apply campaign the cart qualifies for — no code needed. Only used when
 * the customer hasn't entered a promo code themselves, so the two never stack.
 */
export async function findAutoApplyCampaign(subtotalKobo: number, productLines?: string[]): Promise<CampaignCheck | null> {
  const candidates = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.auto_apply, true), eq(campaigns.is_active, true)));

  let best: { campaign: CampaignRow; discount_kobo: number } | null = null;
  for (const c of candidates) {
    if (!checkEligibility(c, subtotalKobo, productLines).ok) continue;
    const amount = discountKobo(c, subtotalKobo);
    // FREE_DELIVERY campaigns discount nothing directly, but still count as "best" if nothing else qualifies.
    if (!best || amount > best.discount_kobo) best = { campaign: c, discount_kobo: amount };
  }
  if (!best) return null;

  return {
    valid: true,
    message: "Bulk discount applied.",
    campaign: best.campaign,
    campaign_id: best.campaign.id,
    discount_kobo: best.discount_kobo,
    free_delivery: best.campaign.discount_type === "FREE_DELIVERY",
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
