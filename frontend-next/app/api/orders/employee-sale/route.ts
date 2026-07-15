import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, products } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { loadCartProducts, nextOrderNumber, type CartItem } from "@/app/api/_lib/orders";
import { recordPoints, pointsForSpend } from "@/app/api/_lib/loyalty";

/** POST /orders/employee-sale — POS sale by staff. Idempotent via client_reference. */
export async function POST(req: Request) {
  const staff = await guard(req, ["employee", "admin"]);
  if (staff instanceof NextResponse) return staff;

  const b = await body<{
    items?: CartItem[];
    payment_method?: "CASH" | "MOMO" | "CARD";
    payment_reference?: string;
    customer_id?: string;
    customer_phone?: string;
    stand_name?: string;
    client_reference?: string;
  }>(req);

  if (!b.items?.length) return validationError({ items: ["No items in the sale."] });
  if (!b.payment_method) return validationError({ payment_method: ["Payment method is required."] });

  // Idempotency — replaying the same client_reference returns the first order.
  if (b.client_reference) {
    const [existing] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.employee_id, staff.id),
          eq(orders.source, "EMPLOYEE_SALE"),
          eq(orders.paystack_reference, b.client_reference),
        ),
      )
      .limit(1);
    if (existing) return json(existing, 200);
  }

  let productsById;
  try {
    productsById = await loadCartProducts(b.items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Invalid cart.", 422);
  }

  const lines = b.items.map((it) => {
    const p = productsById.get(it.product_id)!;
    const qty = Math.max(1, it.quantity);
    const gross = p.price_kobo * qty;
    const lineDiscount = Math.max(0, Math.min(gross, it.line_discount_kobo ?? 0));
    return {
      product_id: p.id,
      product_name: p.name,
      product_variant: p.variant,
      weight_grams: p.weight_grams,
      quantity: qty,
      unit_price_kobo: p.price_kobo,
      subtotal_kobo: gross - lineDiscount,
      _discount: lineDiscount,
    };
  });
  const subtotal = lines.reduce((n, l) => n + l.subtotal_kobo + l._discount, 0);
  const discount = lines.reduce((n, l) => n + l._discount, 0);
  const total = Math.max(0, subtotal - discount);

  const [order] = await db
    .insert(orders)
    .values({
      order_number: await nextOrderNumber(),
      customer_id: b.customer_id ?? staff.id,
      employee_id: staff.id,
      status: "DELIVERED",
      delivery_method: "PICKUP",
      pickup_location_name: b.stand_name ?? null,
      subtotal_kobo: subtotal,
      delivery_fee_kobo: 0,
      discount_kobo: discount,
      total_kobo: total,
      payment_method: b.payment_method,
      payment_reference: b.payment_reference ?? null,
      payment_status: "PAID",
      paystack_reference: b.client_reference ?? null,
      source: "EMPLOYEE_SALE",
      notes: b.customer_phone ?? null,
    })
    .returning();

  await db.insert(orderItems).values(
    lines.map(({ _discount, ...l }) => {
      void _discount;
      return { ...l, order_id: order.id };
    }),
  );
  await db.insert(orderStatusHistory).values({
    order_id: order.id,
    status: "DELIVERED",
    changed_by: staff.id,
    note: "POS sale.",
  });

  // Decrement stock atomically (floor at 0).
  for (const l of lines) {
    await db
      .update(products)
      .set({ stock_qty: sql`GREATEST(${products.stock_qty} - ${l.quantity}, 0)` })
      .where(eq(products.id, l.product_id));
  }

  // Only award points when the sale is attributed to a real customer account
  // (not the walk-in default of crediting the staff member's own id).
  if (b.customer_id) {
    await recordPoints(b.customer_id, pointsForSpend(total), "ORDER_EARNED", order.id);
  }

  return json(order, 201);
}
