export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, addresses } from "@/db/schema";
import { body, fail, json, validationError } from "@/app/api/_lib/http";
import { guard } from "@/app/api/_lib/auth";
import { loadCartProducts, type CartItem } from "@/app/api/_lib/orders";
import { nextDeliveryDate, type Frequency } from "@/app/api/_lib/subscriptions";

/** GET /subscriptions — the customer's meat-box subscriptions. */
export async function GET(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, user.id))
    .orderBy(desc(subscriptions.created_at));

  return json({ data: rows });
}

const FREQUENCIES: Frequency[] = ["WEEKLY", "BIWEEKLY", "MONTHLY"];

/** POST /subscriptions — start a new recurring meat box. */
export async function POST(req: Request) {
  const user = await guard(req);
  if (user instanceof NextResponse) return user;

  const b = await body<{
    items?: CartItem[];
    frequency?: Frequency;
    delivery_method?: "HOME" | "PICKUP";
    address_id?: string;
  }>(req);

  if (!b.items?.length) return validationError({ items: ["Add at least one product to the box."] });
  if (!b.frequency || !FREQUENCIES.includes(b.frequency)) {
    return validationError({ frequency: ["Choose weekly, biweekly, or monthly."] });
  }

  try {
    await loadCartProducts(b.items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Invalid items.", 422);
  }

  const deliveryMethod = b.delivery_method === "PICKUP" ? "PICKUP" : "HOME";
  let addressId: string | null = null;
  if (deliveryMethod === "HOME") {
    if (!b.address_id) return validationError({ address_id: ["A delivery address is required."] });
    const [owned] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.id, b.address_id), eq(addresses.user_id, user.id)))
      .limit(1);
    if (!owned) return validationError({ address_id: ["Address not found."] });
    addressId = owned.id;
  }

  const [sub] = await db
    .insert(subscriptions)
    .values({
      user_id: user.id,
      items: b.items,
      frequency: b.frequency,
      delivery_method: deliveryMethod,
      address_id: addressId,
      next_delivery_date: nextDeliveryDate(b.frequency, new Date()),
    })
    .returning();

  return json(sub, 201);
}
