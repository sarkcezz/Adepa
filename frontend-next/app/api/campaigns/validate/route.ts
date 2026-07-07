import { body, json } from "@/app/api/_lib/http";
import { validateCampaign } from "@/app/api/_lib/orders";

export async function POST(req: Request) {
  const b = await body<{ code?: string; subtotal_kobo?: number; product_lines?: string[] }>(req);
  if (!b.code?.trim()) return json({ valid: false, message: "Enter a promo code." });

  const res = await validateCampaign(b.code.trim(), b.subtotal_kobo ?? 0, b.product_lines);
  return json({
    valid: res.valid,
    message: res.message,
    discount_kobo: res.discount_kobo ?? 0,
    free_delivery: res.free_delivery ?? false,
  });
}
