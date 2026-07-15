export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { giftCards } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { verifyTransaction } from "@/app/api/_lib/paystack";
import { generateGiftCardCode, giftCardExpiry } from "@/app/api/_lib/gift-cards";

const MIN_KOBO = 5000; // GHS 50
const MAX_KOBO = 200000; // GHS 2,000

/** GET /gift-cards — gift cards the signed-in user has purchased. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const rows = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.purchased_by, user.id))
    .orderBy(desc(giftCards.created_at));

  return json({ data: rows });
}

/** POST /gift-cards — buy a gift card (Paystack-verified). */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{
    amount_kobo?: number;
    recipient_name?: string;
    recipient_email?: string;
    message?: string;
    paystack_reference?: string;
  }>(req);

  const amount = Number(b.amount_kobo);
  if (!Number.isInteger(amount) || amount < MIN_KOBO || amount > MAX_KOBO) {
    return validationError({ amount_kobo: [`Amount must be between GHS ${MIN_KOBO / 100} and GHS ${MAX_KOBO / 100}.`] });
  }
  if (!b.paystack_reference) return validationError({ paystack_reference: ["Payment reference is required."] });

  const verified = await verifyTransaction(b.paystack_reference, amount);
  if (!verified.ok) {
    return fail("We couldn't confirm this payment. If you were charged, contact support before retrying.", 402);
  }

  const code = await generateGiftCardCode();
  const [card] = await db
    .insert(giftCards)
    .values({
      code,
      initial_balance_kobo: amount,
      balance_kobo: amount,
      purchased_by: user.id,
      recipient_name: b.recipient_name?.trim() || null,
      recipient_email: b.recipient_email?.trim().toLowerCase() || null,
      message: b.message?.trim() || null,
      expires_at: giftCardExpiry(),
    })
    .returning();

  if (!card) return fail("Could not create gift card.", 500);
  return json(card, 201);
}
