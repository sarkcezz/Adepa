import { body, json } from "@/app/api/_lib/http";
import { findAutoApplyCampaign } from "@/app/api/_lib/orders";

/** POST /campaigns/auto-apply { subtotal_kobo, product_lines } — the checkout's live preview of a no-code bulk discount, so it's visible before the order is placed rather than only appearing on the confirmation. */
export async function POST(req: Request) {
  const b = await body<{ subtotal_kobo?: number; product_lines?: string[] }>(req);
  const res = await findAutoApplyCampaign(b.subtotal_kobo ?? 0, b.product_lines);
  if (!res) return json({ valid: false });

  return json({
    valid: true,
    message: res.message,
    campaign_name: res.campaign?.name,
    discount_kobo: res.discount_kobo ?? 0,
    free_delivery: res.free_delivery ?? false,
  });
}
