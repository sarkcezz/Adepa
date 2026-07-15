/** Pesewas (GHS × 100) → "GHS 12.50". */
export function formatGhs(kobo: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format((kobo ?? 0) / 100);
}

export function formatWeight(grams?: number | null): string {
  if (!grams) return "";
  return grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)}kg` : `${grams}g`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const PRODUCT_LINE_LABEL: Record<string, string> = {
  RAW: "Raw cut",
  SPICED: "Spiced",
  READY_TO_EAT: "Ready to eat",
};

/** Cut-based shop taxonomy — a descriptive facet layered on top of product_line/variant. */
export const PRODUCT_CATEGORIES = [
  "PORK_CHOPS",
  "PORK_BELLY",
  "RIBS",
  "LEG",
  "SHOULDER",
  "TENDERLOIN",
  "MINCED_PORK",
  "SAUSAGES",
  "SMOKED_PORK",
  "HAM",
  "BACON",
  "FAMILY_PACK",
  "BBQ_PACK",
  "RESTAURANT_PACK",
  "BULK_ORDER",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  PORK_CHOPS: "Pork Chops",
  PORK_BELLY: "Pork Belly",
  RIBS: "Ribs",
  LEG: "Leg",
  SHOULDER: "Shoulder",
  TENDERLOIN: "Tenderloin",
  MINCED_PORK: "Minced Pork",
  SAUSAGES: "Sausages",
  SMOKED_PORK: "Smoked Pork",
  HAM: "Ham",
  BACON: "Bacon",
  FAMILY_PACK: "Family Pack",
  BBQ_PACK: "BBQ Pack",
  RESTAURANT_PACK: "Restaurant Pack",
  BULK_ORDER: "Bulk Order",
};
