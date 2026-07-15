"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/site/logo";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const mounted = useHasMounted();
  const { user, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (mounted && !token) router.replace(`/login?next=/account/orders/${id}/invoice`);
  }, [mounted, token, id, router]);

  useEffect(() => {
    if (!token) return;
    api<Order>(`/orders/${id}`, { token }).then(setOrder).catch(() => setOrder(null));
  }, [token, id]);

  if (!mounted || !token) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/account/orders/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to order
        </Link>
        <Button className="rounded-full" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / Save as PDF
        </Button>
      </div>

      {order === null ? (
        <Skeleton className="mt-8 h-96 w-full rounded-3xl" />
      ) : (
        <div className="mt-6 rounded-3xl border border-border/60 bg-card p-8 print:mt-0 print:rounded-none print:border-0 print:p-0">
          <div className="flex items-start justify-between gap-4">
            <Logo />
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">Invoice</p>
              <p>{order.order_number}</p>
              <p>{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed to</p>
              <p className="mt-1 text-sm font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email || user?.phone}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</p>
              <p className="mt-1 text-sm font-semibold">Adepa Pork Hub</p>
              <p className="text-sm text-muted-foreground">Ejisu-Krapa, Ashanti Region, Ghana</p>
              <p className="text-sm text-muted-foreground">orders@adepaporkhub.shop</p>
            </div>
          </div>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Unit price</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {order.items?.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5">
                    {it.product_name}
                    {it.product_variant !== "NONE" && <span className="text-muted-foreground"> · {it.product_variant.toLowerCase()}</span>}
                  </td>
                  <td className="py-2.5 text-center tabular-nums">{it.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatGhs(it.unit_price_kobo)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatGhs(it.subtotal_kobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatGhs(order.subtotal_kobo)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{order.delivery_fee_kobo === 0 ? "Free" : formatGhs(order.delivery_fee_kobo)}</dd></div>
              {order.discount_kobo > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Promo discount</dt><dd className="tabular-nums">− {formatGhs(order.discount_kobo)}</dd></div>}
              {!!order.loyalty_kobo && order.loyalty_kobo > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Rewards points</dt><dd className="tabular-nums">− {formatGhs(order.loyalty_kobo)}</dd></div>}
              {!!order.gift_card_kobo && order.gift_card_kobo > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Gift card</dt><dd className="tabular-nums">− {formatGhs(order.gift_card_kobo)}</dd></div>}
              <div className="flex justify-between border-t border-border/60 pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatGhs(order.total_kobo)}</dd></div>
            </dl>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>Payment: {order.payment_method} · {order.payment_status}</span>
            <span>Thank you for your order.</span>
          </div>
        </div>
      )}
    </div>
  );
}
