export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, campaigns, campaignUsages } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import {
  HOME_DELIVERY_FEE_KOBO,
  loadCartProducts,
  nextOrderNumber,
  validateCampaign,
  type CartItem,
} from "@/app/api/_lib/orders";
import { verifyTransaction } from "@/app/api/_lib/paystack";
import { notifyUser } from "@/app/api/_lib/notifications";
import { formatGhs } from "@/lib/format";

/** POST /orders — customer checkout. */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{
    items?: CartItem[];
    delivery_method?: "HOME" | "PICKUP" | "EVENT";
    payment_method?: "MOMO" | "CARD" | "CASH" | "BANK";
    paystack_reference?: string;
    promo_code?: string;
    address_id?: string;
    pickup_location_name?: string;
  }>(req);

  if (!b.items?.length) return validationError({ items: ["Your cart is empty."] });
  if (!b.delivery_method) return validationError({ delivery_method: ["Delivery method is required."] });

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

  let deliveryFee = b.delivery_method === "HOME" ? HOME_DELIVERY_FEE_KOBO : 0;
  if (freeDelivery) deliveryFee = 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // A reference means the customer completed the Paystack popup — confirm the
  // charge actually cleared, for the amount we expect, before trusting it.
  let paid = false;
  if (b.paystack_reference && b.delivery_method !== "PICKUP") {
    const verified = await verifyTransaction(b.paystack_reference, total);
    if (!verified.ok) {
      return fail("We couldn't confirm this payment. If you were charged, contact support before retrying.", 402);
    }
    paid = true;
  }

  const orderNumber = await nextOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      order_number: orderNumber,
      customer_id: user.id,
      status: "PENDING",
      delivery_method: b.delivery_method,
      address_id: b.delivery_method === "HOME" ? b.address_id ?? null : null,
      pickup_location_name: b.delivery_method === "PICKUP" ? b.pickup_location_name ?? null : null,
      subtotal_kobo: subtotal,
      delivery_fee_kobo: deliveryFee,
      discount_kobo: discount,
      total_kobo: total,
      payment_method: b.payment_method ?? "MOMO",
      paystack_reference: b.paystack_reference ?? null,
      payment_status: paid ? "PAID" : "PENDING",
      source: "ONLINE",
      campaign_id: campaignId,
    })
    .returning();

  await db.insert(orderItems).values(lines.map((l) => ({ ...l, order_id: order.id })));
  await db.insert(orderStatusHistory).values({
    order_id: order.id,
    status: "PENDING",
    changed_by: user.id,
    note: "Order placed.",
  });

  if (campaignId) {
    await db
      .update(campaigns)
      .set({ usage_count: sql`${campaigns.usage_count} + 1` })
      .where(eq(campaigns.id, campaignId));
    await db.insert(campaignUsages).values({
      campaign_id: campaignId,
      order_id: order.id,
      customer_id: user.id,
      discount_applied_kobo: discount,
    });
  }

  void notifyUser(user.id, {
    type: "order.placed",
    title: `Order ${order.order_number} received`,
    message: `We've got your order for ${formatGhs(total)}. We'll update you as it moves.`,
    email: true,
    sms: true,
  });

  return json(order, 201);
}
