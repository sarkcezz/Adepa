export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatusHistory, eventRegistrations } from "@/db/schema";
import { verifyWebhookSignature } from "@/app/api/_lib/paystack";

/**
 * POST /paystack/webhook — Paystack's server-to-server event delivery.
 * Ground truth even if the customer closes the tab right after paying (the
 * client-side `onSuccess` callback never firing shouldn't leave a paid order
 * stuck PENDING). Requires PAYSTACK_SECRET_KEY; returns 200 either way so
 * Paystack doesn't retry into a black hole while the key is unset.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const valid = await verifyWebhookSignature(raw, signature);
  if (!valid) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return new Response(null, { status: 200 }); // not configured yet — accept and no-op
    }
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  const reference = event.data?.reference;

  if (event.event === "charge.success" && reference) {
    const [order] = await db
      .select({ id: orders.id, payment_status: orders.payment_status })
      .from(orders)
      .where(eq(orders.paystack_reference, reference))
      .limit(1);

    if (order && order.payment_status !== "PAID") {
      await db.update(orders).set({ payment_status: "PAID", updated_at: new Date() }).where(eq(orders.id, order.id));
      await db.insert(orderStatusHistory).values({
        order_id: order.id,
        status: "CONFIRMED",
        note: "Payment confirmed via Paystack webhook.",
      });
    } else {
      await db
        .update(eventRegistrations)
        .set({ payment_status: "PAID", updated_at: new Date() })
        .where(eq(eventRegistrations.paystack_reference, reference));
    }
  }

  return new Response(null, { status: 200 });
}
