/**
 * Delivery pricing: a per-district base fee (closer districts around the
 * Ejisu-Krapa shop cost less than further-out ones), plus a per-kg surcharge
 * once an order's total product weight passes a free allowance.
 *
 * Zone fees and the global knobs (default fee, free allowance, surcharge)
 * are admin-editable, stored in shipping_zones / shipping_settings — see
 * /admin/shipping. This file just does the lookup and the math.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shippingZones, shippingSettings } from "@/db/schema";

export const SHIPPING_SETTINGS_ID = "default";

/** Fallback used only if the singleton settings row is somehow missing (should never happen post-migration). */
export const DEFAULT_ZONE_FEE_KOBO = 2000;
const FALLBACK_FREE_WEIGHT_GRAMS = 5000;
const FALLBACK_SURCHARGE_PER_KG_KOBO = 200;

/** Pure fee math — no DB access, so it's cheap to unit test directly. */
export function computeDeliveryFeeKobo(
  zoneFeeKobo: number,
  totalWeightGrams: number,
  freeWeightGrams: number,
  surchargePerKgKobo: number,
): number {
  const extraGrams = Math.max(0, totalWeightGrams - freeWeightGrams);
  const extraKg = Math.ceil(extraGrams / 1000);
  return zoneFeeKobo + extraKg * surchargePerKgKobo;
}

/** Looks up the admin-configured zone fee + global settings, then applies computeDeliveryFeeKobo. */
export async function calculateDeliveryFeeKobo(district: string | null | undefined, totalWeightGrams: number): Promise<number> {
  const key = (district ?? "").trim().toLowerCase();

  const [settingsRow, zoneRow] = await Promise.all([
    db.select().from(shippingSettings).where(eq(shippingSettings.id, SHIPPING_SETTINGS_ID)).limit(1),
    key ? db.select().from(shippingZones).where(eq(shippingZones.district, key)).limit(1) : Promise.resolve([]),
  ]);

  const settings = settingsRow[0];
  const zoneFee = zoneRow[0]?.fee_kobo ?? settings?.default_fee_kobo ?? DEFAULT_ZONE_FEE_KOBO;
  const freeWeight = settings?.free_weight_grams ?? FALLBACK_FREE_WEIGHT_GRAMS;
  const surcharge = settings?.surcharge_per_kg_kobo ?? FALLBACK_SURCHARGE_PER_KG_KOBO;

  return computeDeliveryFeeKobo(zoneFee, totalWeightGrams, freeWeight, surcharge);
}
