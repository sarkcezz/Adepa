export const dynamic = "force-dynamic";

import { body, json, validationError } from "@/app/api/_lib/http";
import { checkGiftCard } from "@/app/api/_lib/gift-cards";

/** POST /gift-cards/validate { code } — public balance check before checkout. */
export async function POST(req: Request) {
  const b = await body<{ code?: string }>(req);
  if (!b.code?.trim()) return validationError({ code: ["A gift card code is required."] });

  const result = await checkGiftCard(b.code);
  return json(result);
}
