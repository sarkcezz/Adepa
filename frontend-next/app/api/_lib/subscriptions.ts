import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, orders, orderItems, orderStatusHistory, addresses } from "@/db/schema";
import { loadCartProducts, nextOrderNumber, type CartItem } from "./orders";
import { notifyUser } from "./notifications";
import { calculateDeliveryFeeKobo } from "./shipping";
import { formatGhs } from "@/lib/format";

export type Frequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

const DAYS: Record<Frequency, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };

export function nextDeliveryDate(frequency: Frequency, from: Date): string {
  const d = new Date(from);
  d.setDate(d.getDate() + DAYS[frequency]);
  return d.toISOString().slice(0, 10);
}

/**
 * Turns each due subscription into a real order. There's no stored card to
 * auto-charge, so generated orders are cash-on-delivery/pickup — the driver
 * (or stand) collects payment same as any other CASH order.
 */
export async function processDueSubscriptions(): Promise<{ processed: number; failed: number }> {
  const due = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "ACTIVE"), lte(subscriptions.next_delivery_date, new Date().toISOString().slice(0, 10))));

  let processed = 0;
  let failed = 0;

  for (const sub of due) {
    try {
      const items = sub.items as CartItem[];
      const productsById = await loadCartProducts(items);
      const lines = items.map((it) => {
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

      let deliveryFee = 0;
      if (sub.delivery_method === "HOME") {
        const [address] = sub.address_id
          ? await db.select({ district: addresses.district }).from(addresses).where(eq(addresses.id, sub.address_id)).limit(1)
          : [];
        deliveryFee = calculateDeliveryFeeKobo(address?.district, totalWeightGrams);
      }

      const [order] = await db
        .insert(orders)
        .values({
          order_number: await nextOrderNumber(),
          customer_id: sub.user_id,
          status: "PENDING",
          delivery_method: sub.delivery_method,
          address_id: sub.address_id,
          subtotal_kobo: subtotal,
          delivery_fee_kobo: deliveryFee,
          total_kobo: subtotal + deliveryFee,
          payment_method: "CASH",
          payment_status: "PENDING",
          source: "ONLINE",
          notes: "Recurring subscription box.",
        })
        .returning();

      await db.insert(orderItems).values(lines.map((l) => ({ ...l, order_id: order.id })));
      await db.insert(orderStatusHistory).values({
        order_id: order.id,
        status: "PENDING",
        note: "Auto-generated from subscription.",
      });

      await db
        .update(subscriptions)
        .set({ next_delivery_date: nextDeliveryDate(sub.frequency, new Date()), updated_at: new Date() })
        .where(eq(subscriptions.id, sub.id));

      await notifyUser(sub.user_id, {
        type: "subscription.renewed",
        title: `Your subscription box is on its way — order ${order.order_number}`,
        message: `We've started order ${order.order_number} (${formatGhs(order.total_kobo)}), due for your ${sub.frequency.toLowerCase()} delivery. Pay on delivery as usual.`,
        email: true,
        sms: true,
      });

      processed++;
    } catch (e) {
      console.error(`[subscriptions] failed to process ${sub.id}`, e);
      failed++;
    }
  }

  return { processed, failed };
}
