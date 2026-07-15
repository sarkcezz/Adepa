/**
 * Delivery pricing: a per-district base fee (closer districts around the
 * Ejisu-Krapa shop cost less than further-out ones), plus a per-kg surcharge
 * once an order's total product weight passes a free allowance.
 */
const ZONE_FEE_KOBO: Record<string, number> = {
  "ejisu": 1000,
  "ejisu-juaben": 1000,
  "bosome freho": 1500,
  "asokwa": 1500,
  "oforikrom": 1500,
  "kumasi metropolitan": 1500,
  "subin": 1500,
  "asokore mampong": 1700,
  "old tafo": 1700,
  "suame": 1700,
  "kwadaso": 1700,
  "bosomtwe": 1800,
  "atwima nwabiagya": 1900,
  "atwima kwanwoma": 1900,
};

export const DEFAULT_ZONE_FEE_KOBO = 2000;
const FREE_WEIGHT_GRAMS = 5000;
const SURCHARGE_PER_KG_KOBO = 200;

export function calculateDeliveryFeeKobo(district: string | null | undefined, totalWeightGrams: number): number {
  const key = (district ?? "").trim().toLowerCase();
  const base = ZONE_FEE_KOBO[key] ?? DEFAULT_ZONE_FEE_KOBO;
  const extraGrams = Math.max(0, totalWeightGrams - FREE_WEIGHT_GRAMS);
  const extraKg = Math.ceil(extraGrams / 1000);
  return base + extraKg * SURCHARGE_PER_KG_KOBO;
}
