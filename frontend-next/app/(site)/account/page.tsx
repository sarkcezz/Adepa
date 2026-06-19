"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Truck, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { isActive } from "@/lib/order";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

export default function AccountPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account");
  }, [mounted, token, router]);

  useEffect(() => {
    if (!token) return;
    api<Paginated<Order>>("/orders/my", { token })
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }, [token]);

  if (!mounted || !token || !user) return null;

  const live = orders?.find((o) => isActive(o.status));
  const totalSpend = (orders ?? []).filter((o) => o.payment_status === "PAID").reduce((n, o) => n + o.total_kobo, 0);
  const activeCount = (orders ?? []).filter((o) => isActive(o.status)).length;

  async function signOut() {
    await logout();
    toast.success("Signed out.");
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Your account</span>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
            Hello, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email || user.phone}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={signOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>

      {/* Live order or browse CTA */}
      {orders === null ? (
        <Skeleton className="mt-8 h-28 w-full rounded-3xl" />
      ) : live ? (
        <Link
          href={`/account/orders/${live.id}`}
          className="mt-8 flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground transition-transform hover:-translate-y-0.5 grain"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-accent" /> In progress
            </span>
            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold">Order {live.order_number}</p>
            <p className="mt-1 text-sm text-primary-foreground/80">{formatGhs(live.total_kobo)} · tap to track live</p>
          </div>
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-primary">
            <Truck className="size-6" />
          </div>
        </Link>
      ) : (
        <Link
          href="/menu"
          className="mt-8 flex items-center justify-between rounded-3xl border border-border/60 bg-card p-6 transition-transform hover:-translate-y-0.5"
        >
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">No active orders</p>
            <p className="mt-1 text-sm text-muted-foreground">Hungry? Browse the menu.</p>
          </div>
          <ArrowRight className="size-5 text-primary" />
        </Link>
      )}

      {/* Stat strip */}
      <div className="mt-6 grid grid-cols-3 divide-x divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {[
          ["Total spend", formatGhs(totalSpend)],
          ["Orders", String(orders?.length ?? 0)],
          ["Active", String(activeCount)],
        ].map(([label, val]) => (
          <div key={label} className="px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold tabular-nums">{val}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Recent orders</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {orders === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-12 text-center">
            <ShoppingBag className="size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No orders yet.</p>
            <Button className="mt-4 rounded-full" render={<Link href="/menu" />}>Browse menu</Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-secondary/50">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{o.order_number}</p>
                    <p className="text-sm font-semibold">{formatDate(o.created_at)} · {o.items?.length ?? 0} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-display)] font-bold tabular-nums">{formatGhs(o.total_kobo)}</span>
                    <OrderStatusBadge status={o.status} />
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
