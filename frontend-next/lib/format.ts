/** Pesewas (GHS × 100) → "GHS 12.50". */
export function formatGhs(kobo: number): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format((kobo ?? 0) / 100);
}

/** Pork is sold by the pound storefront-wide — weight is stored in grams, displayed in lb. */
export const GRAMS_PER_LB = 453.592;

export function gramsToLb(grams: number): number {
  return grams / GRAMS_PER_LB;
}

export function lbToGrams(lb: number): number {
  return Math.round(lb * GRAMS_PER_LB);
}

export function formatWeight(grams?: number | null): string {
  if (!grams) return "";
  const lb = Math.round(gramsToLb(grams) * 10) / 10;
  return `${lb % 1 === 0 ? lb.toFixed(0) : lb.toFixed(1)}lb`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** DB "date" + "time" columns (e.g. "2026-09-12", "17:00:00") → "Sat, 12 Sept 2026 · 5:00 PM". */
export function formatEventDateTime(dateStr: string, timeStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const dateLabel = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${dateLabel} · ${h12}:${String(m).padStart(2, "0")} ${period}`;
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
  "FRENCHED_RACK",
  "HOCK",
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
  FRENCHED_RACK: "Frenched Rack",
  HOCK: "Hock",
  BULK_ORDER: "Bulk Order",
};
