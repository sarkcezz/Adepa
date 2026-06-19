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
