import { eq } from "drizzle-orm";
import { db } from "@/db";
import { giftCards } from "@/db/schema";

const GIFT_CARD_VALIDITY_DAYS = 365;

function randomCode(): string {
  const chunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GIFT-${chunk()}-${chunk()}`;
}

export async function generateGiftCardCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    const [clash] = await db.select({ id: giftCards.id }).from(giftCards).where(eq(giftCards.code, code)).limit(1);
    if (!clash) return code;
  }
  throw new Error("Could not generate a unique gift card code.");
}

export function giftCardExpiry(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + GIFT_CARD_VALIDITY_DAYS);
  return d;
}

export interface GiftCardCheck {
  valid: boolean;
  message: string;
  gift_card_id?: string;
  balance_kobo?: number;
}

/** Validates a gift card code without consuming it. */
export async function checkGiftCard(code: string): Promise<GiftCardCheck> {
  const [card] = await db.select().from(giftCards).where(eq(giftCards.code, code.trim().toUpperCase())).limit(1);
  if (!card) return { valid: false, message: "Gift card not found." };
  if (!card.is_active) return { valid: false, message: "This gift card is no longer active." };
  if (card.expires_at && card.expires_at.getTime() < Date.now()) return { valid: false, message: "This gift card has expired." };
  if (card.balance_kobo <= 0) return { valid: false, message: "This gift card has no remaining balance." };
  return { valid: true, message: "Gift card applied.", gift_card_id: card.id, balance_kobo: card.balance_kobo };
}
