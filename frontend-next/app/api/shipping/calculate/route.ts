export const dynamic = "force-dynamic";

import { body, json, validationError } from "@/app/api/_lib/http";
import { loadCartProducts, type CartItem } from "@/app/api/_lib/orders";
import { calculateDeliveryFeeKobo } from "@/app/api/_lib/shipping";

/** POST /shipping/calculate { district, items } — live delivery-fee preview for checkout. */
export async function POST(req: Request) {
  const b = await body<{ district?: string; items?: CartItem[] }>(req);
  if (!b.items?.length) return validationError({ items: ["Add items to estimate delivery."] });

  let totalWeightGrams = 0;
  try {
    const productsById = await loadCartProducts(b.items);
    totalWeightGrams = b.items.reduce((n, it) => n + (productsById.get(it.product_id)!.weight_grams ?? 0) * Math.max(1, it.quantity), 0);
  } catch {
    // Unknown products just fall back to the zone base fee (no weight surcharge).
  }

  return json({ fee_kobo: calculateDeliveryFeeKobo(b.district, totalWeightGrams) });
}
