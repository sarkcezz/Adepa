"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

export default function OrdersPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account/orders");
  }, [mounted, token, router]);

  useEffect(() => {
    if (!token) return;
    api<Paginated<Order>>("/orders/my", { token })
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Account
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold">Your orders</h1>

      <div className="mt-8">
        {orders === null ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <ShoppingBag className="size-7 text-muted-foreground" />
            <p className="mt-3 font-semibold">No orders yet</p>
            <Button className="mt-4 rounded-full" render={<Link href="/menu" />}>Browse menu</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-muted-foreground">{o.order_number}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold">{formatDate(o.created_at)}</p>
                    <p className="text-xs text-muted-foreground">{o.items?.length ?? 0} items · {o.delivery_method.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-display)] text-lg font-bold tabular-nums">{formatGhs(o.total_kobo)}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
