export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, campaigns, campaignUsages, addresses, giftCards } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { resolveCheckoutUser } from "@/app/api/_lib/auth";
import {
  loadCartProducts,
  nextOrderNumber,
  validateCampaign,
  type CartItem,
} from "@/app/api/_lib/orders";
import { calculateDeliveryFeeKobo } from "@/app/api/_lib/shipping";
import { verifyTransaction } from "@/app/api/_lib/paystack";
import { notifyUser } from "@/app/api/_lib/notifications";
import { formatGhs } from "@/lib/format";
import { loyaltyBalance, recordPoints, redeemPointsIfAvailable, pointsForSpend, redeemValueKobo, KOBO_PER_POINT_REDEEMED } from "@/app/api/_lib/loyalty";
import { awardReferralBonusIfEligible } from "@/app/api/_lib/referral";
import { checkGiftCard } from "@/app/api/_lib/gift-cards";

/** POST /orders — customer checkout (signed-in or guest). */
export async function POST(req: Request) {
  const b = await body<{
    items?: CartItem[];
    delivery_method?: "HOME" | "PICKUP" | "EVENT";
    payment_method?: "MOMO" | "CARD" | "CASH" | "BANK";
    paystack_reference?: string;
    promo_code?: string;
    address_id?: string;
    new_address?: {
      recipient?: string; phone?: string; area?: string; district?: string;
      landmark?: string; label?: string;
    };
    pickup_location_name?: string;
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    redeem_points?: number;
    gift_card_code?: string;
  }>(req);

  // Idempotency: a completed Paystack payment can reach this route twice (the
  // checkout page deliberately retries createOrder() with the SAME reference
  // if the first response is lost, e.g. a dropped connection right after the
  // server already committed). Without this, a single charge could mint two
  // paid orders. A reference uniquely identifies one checkout attempt, so if
  // an order already carries it, that IS the answer — return it as-is rather
  // than creating a duplicate.
  if (b.paystack_reference) {
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.paystack_reference, b.paystack_reference))
      .limit(1);
    if (existing) return json(existing, 200);
  }

  const user = await resolveCheckoutUser(req, {
    name: b.guest_name,
    phone: b.guest_phone,
    email: b.guest_email,
  });
  if (user instanceof NextResponse) return user;

  if (!b.items?.length) return validationError({ items: ["Your cart is empty."] });
  if (!b.delivery_method) return validationError({ delivery_method: ["Delivery method is required."] });

  // Resolve the delivery address: an existing saved address (verified to
  // belong to this user) or a one-off address created inline (guest checkout,
  // or a signed-in customer ordering to a new address).
  let addressId: string | null = null;
  let addressDistrict: string | null = null;
  if (b.delivery_method === "HOME") {
    if (b.address_id) {
      const [owned] = await db
        .select({ id: addresses.id, district: addresses.district })
        .from(addresses)
        .where(and(eq(addresses.id, b.address_id), eq(addresses.user_id, user.id)))
        .limit(1);
      if (!owned) return validationError({ address_id: ["Address not found."] });
      addressId = owned.id;
      addressDistrict = owned.district;
    } else if (b.new_address?.recipient && b.new_address?.phone && b.new_address?.area && b.new_address?.district) {
      const [created] = await db
        .insert(addresses)
        .values({
          user_id: user.id,
          recipient: b.new_address.recipient.trim(),
          phone: b.new_address.phone.trim(),
          area: b.new_address.area.trim(),
          district: b.new_address.district.trim(),
          landmark: b.new_address.landmark?.trim() || null,
          label: b.new_address.label?.trim() || "Home",
        })
        .returning();
      addressId = created.id;
      addressDistrict = created.district;
    } else {
      return validationError({ address_id: ["A delivery address is required."] });
    }
  }

  let productsById;
  try {
    productsById = await loadCartProducts(b.items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Invalid cart.", 422);
  }

  // Build line items + subtotal from server-side prices (never trust the client).
  const lines = b.items.map((it) => {
    const p = productsById.get(it.product_id)!;
    const qty = Math.max(1, it.quantity);
    return {
      product_id: p.id,
      product_name: p.name,
      product_variant: p.variant,
      weight_grams: p.weight_grams,
      quantity: qty,
      unit_price_kobo: p.price_kobo,
      subtotal_kobo: p.price_kobo * qty,
    };
  });
  const subtotal = lines.reduce((n, l) => n + l.subtotal_kobo, 0);
  const totalWeightGrams = lines.reduce((n, l) => n + (l.weight_grams ?? 0) * l.quantity, 0);

  // Campaign
  let discount = 0;
  let campaignId: string | null = null;
  let freeDelivery = false;
  if (b.promo_code?.trim()) {
    const lineCodes = [...new Set(lines.map((l) => productsById.get(l.product_id)!.product_line))];
    const check = await validateCampaign(b.promo_code.trim(), subtotal, lineCodes);
    if (check.valid) {
      discount = check.discount_kobo ?? 0;
      campaignId = check.campaign_id ?? null;
      freeDelivery = !!check.free_delivery;
    }
  }

  let deliveryFee = b.delivery_method === "HOME" ? calculateDeliveryFeeKobo(addressDistrict, totalWeightGrams) : 0;
  if (freeDelivery) deliveryFee = 0;

  // Loyalty redemption — capped to the customer's balance and to what's left to pay.
  // Guests (no account history) have nothing to redeem.
  let loyaltyPoints = 0;
  let loyaltyKobo = 0;
  if (b.redeem_points && b.redeem_points > 0 && !user.is_guest) {
    const preRedemptionTotal = Math.max(0, subtotal + deliveryFee - discount);
    const balance = await loyaltyBalance(user.id);
    const maxRedeemable = Math.min(balance, Math.floor(preRedemptionTotal / KOBO_PER_POINT_REDEEMED));
    loyaltyPoints = Math.min(Math.floor(b.redeem_points), maxRedeemable);
    loyaltyKobo = redeemValueKobo(loyaltyPoints);
  }

  // Gift card — applied after loyalty, capped to what's still owed.
  let giftCardId: string | null = null;
  let giftCardKobo = 0;
  if (b.gift_card_code?.trim()) {
    const check = await checkGiftCard(b.gift_card_code);
    if (!check.valid) return validationError({ gift_card_code: [check.message] });
    const remaining = Math.max(0, subtotal + deliveryFee - discount - loyaltyKobo);
    giftCardId = check.gift_card_id!;
    giftCardKobo = Math.min(check.balance_kobo!, remaining);
  }

  const total = Math.max(0, subtotal + deliveryFee - discount - loyaltyKobo - giftCardKobo);

  // A reference means the customer completed the Paystack popup — confirm the
  // charge actually cleared, for the amount we expect, before trusting it.
  // Nothing to confirm if points/gift card already covered the full total.
  let paid = total === 0;
  if (!paid && b.paystack_reference && b.delivery_method !== "PICKUP") {
    const verified = await verifyTransaction(b.paystack_reference, total);
    if (!verified.ok) {
      return fail("We couldn't confirm this payment. If you were charged, contact support before retrying.", 402);
    }
    paid = true;
  }

  // order_number is derived from MAX(existing)+1, which isn't atomic — two
  // checkouts landing in the same instant can compute the same next number.
  // The column's unique constraint turns that into a clean, retryable insert
  // failure instead of silently colliding, so retry with a freshly computed
  // number rather than surfacing a spurious failure to a customer who paid fine.
  let order;
  for (let attempt = 0; ; attempt++) {
    const orderNumber = await nextOrderNumber();
    try {
      [order] = await db
        .insert(orders)
        .values({
          order_number: orderNumber,
          customer_id: user.id,
          status: "PENDING",
          delivery_method: b.delivery_method,
          address_id: addressId,
          pickup_location_name: b.delivery_method === "PICKUP" ? b.pickup_location_name ?? null : null,
          subtotal_kobo: subtotal,
          delivery_fee_kobo: deliveryFee,
          discount_kobo: discount,
          loyalty_points_redeemed: loyaltyPoints,
          loyalty_kobo: loyaltyKobo,
          gift_card_id: giftCardId,
          gift_card_kobo: giftCardKobo,
          total_kobo: total,
          payment_method: b.payment_method ?? "MOMO",
          paystack_reference: b.paystack_reference ?? null,
          payment_status: paid ? "PAID" : "PENDING",
          source: "ONLINE",
          campaign_id: campaignId,
        })
        .returning();
      break;
    } catch (e) {
      const code = e && typeof e === "object" && "code" in e ? (e as { code?: unknown }).code : undefined;
      if (code !== "23505") throw e;
      // Either order_number collided (retry with a fresh one below) or a
      // concurrent request with the same paystack_reference won the race —
      // in that case its row now exists, so return it instead of retrying
      // into the same conflict.
      if (b.paystack_reference) {
        const [wonByOther] = await db
          .select()
          .from(orders)
          .where(eq(orders.paystack_reference, b.paystack_reference))
          .limit(1);
        if (wonByOther) return json(wonByOther, 200);
      }
      if (attempt >= 2) throw e;
    }
  }

  await db.insert(orderItems).values(lines.map((l) => ({ ...l, order_id: order.id })));
  await db.insert(orderStatusHistory).values({
    order_id: order.id,
    status: "PENDING",
    changed_by: user.id,
    note: "Order placed.",
  });

  if (campaignId) {
    // Conditional, not unconditional: validateCampaign()'s limit check ran
    // before this request's own processing time, so concurrent checkouts can
    // all pass it before any of them increments. The WHERE clause makes the
    // increment itself atomic, capping real drift past max_usage to at most
    // one order already in flight when the limit was reached.
    await db
      .update(campaigns)
      .set({ usage_count: sql`${campaigns.usage_count} + 1` })
      .where(and(eq(campaigns.id, campaignId), sql`(${campaigns.max_usage} IS NULL OR ${campaigns.usage_count} < ${campaigns.max_usage})`));
    await db.insert(campaignUsages).values({
      campaign_id: campaignId,
      order_id: order.id,
      customer_id: user.id,
      discount_applied_kobo: discount,
    });
  }

  if (loyaltyPoints > 0) {
    await redeemPointsIfAvailable(user.id, loyaltyPoints, order.id, `Redeemed on order ${order.order_number}`);
  }
  if (giftCardId && giftCardKobo > 0) {
    await db
      .update(giftCards)
      .set({ balance_kobo: sql`${giftCards.balance_kobo} - ${giftCardKobo}` })
      .where(and(eq(giftCards.id, giftCardId), gte(giftCards.balance_kobo, giftCardKobo)));
  }
  if (paid) {
    await recordPoints(user.id, pointsForSpend(total), "ORDER_EARNED", order.id);
    await awardReferralBonusIfEligible(order.id, user.id);
  }

  waitUntil(notifyUser(user.id, {
    type: "order.placed",
    title: `Order ${order.order_number} received`,
    message: `We've got your order for ${formatGhs(total)}. We'll update you as it moves.`,
    email: true,
    sms: true,
  }));

  return json(order, 201);
}
