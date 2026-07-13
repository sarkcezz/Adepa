"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, RotateCcw, XCircle, Flame } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useCart, useHasMounted } from "@/lib/cart-store";
import { useOrderTracking } from "@/lib/use-order-tracking";
import { TRACK_HERO, STATUS_LABEL, isActive } from "@/lib/order";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTimeline } from "@/components/account/order-timeline";
import { OrderStatusBadge } from "@/components/account/order-status-badge";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const mounted = useHasMounted();
  const token = useAuth((s) => s.token);
  const { add, clear } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<"reorder" | "cancel" | null>(null);

  const { status, history } = useOrderTracking(id, 10000);

  useEffect(() => {
    if (mounted && !token) router.replace(`/login?next=/account/orders/${id}`);
  }, [mounted, token, id, router]);

  useEffect(() => {
    if (!token) return;
    api<Order>(`/orders/${id}`, { token })
      .then(setOrder)
      .catch(() => setNotFound(true));
  }, [token, id]);

  // Live status overrides the initially-fetched status.
  const liveStatus = status ?? order?.status ?? null;

  async function reorder() {
    if (!order?.items?.length) return;
    setBusy("reorder");
    try {
      const products = await Promise.all(
        order.items.map((it) => api<Product>(`/products/${it.product_id}`).then((p) => p).catch(() => null)),
      );
      const available = products.filter((p): p is Product => !!p && p.is_active);
      if (!available.length) {
        toast.error("None of these items are available right now.");
        return;
      }
      clear();
      order.items.forEach((it) => {
        const p = available.find((x) => x.id === it.product_id);
        if (p) add(p, it.quantity);
      });
      toast.success("Added to cart.");
      router.push("/checkout");
    } catch {
      toast.error("Could not rebuild your cart.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!order) return;
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setBusy("cancel");
    try {
      const updated = await api<Order>(`/orders/${order.id}/cancel`, { method: "POST", token: token! });
      setOrder(updated);
      toast.success("Order cancelled.");
    } catch {
      toast.error("Could not cancel. It may already be in preparation.");
    } finally {
      setBusy(null);
    }
  }

  if (!mounted || !token) return null;

  if (notFound) {
    return (
      <div className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 text-center">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold">Order not found</p>
          <Button className="mt-4 rounded-full" render={<Link href="/account/orders" />}>Back to orders</Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-32 w-full rounded-3xl" />
        <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
      </div>
    );
  }

  const hero = liveStatus ? TRACK_HERO[liveStatus] : null;
  const active = liveStatus ? isActive(liveStatus) : false;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Order</span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{order.order_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>
        </div>
        {liveStatus && <OrderStatusBadge status={liveStatus} />}
      </div>

      {/* Live tracking hero */}
      {hero && liveStatus !== "CANCELLED" && (
        <div className="mt-6 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground grain">
          {active && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-accent" /> Live
            </span>
          )}
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold">{hero.headline}</h2>
          <p className="mt-1 text-primary-foreground/80">{hero.sub}</p>
          {hero.eta && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm">
              <Flame className="size-4 text-accent" /> {hero.eta}
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="mt-6 rounded-3xl border border-border/60 bg-card p-6">
        {liveStatus && <OrderTimeline status={liveStatus} />}
        {active && (
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="size-3" /> Updating automatically every 10 seconds
          </p>
        )}
      </div>

      {/* Items + summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</h3>
          <ul className="mt-3 divide-y divide-border/60">
            {order.items?.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.product_variant !== "NONE" ? `${it.product_variant.toLowerCase()} · ` : ""}qty {it.quantity}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{formatGhs(it.subtotal_kobo)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border/60 pt-4">
            <Button variant="outline" className="rounded-full" disabled={busy === "reorder"} onClick={reorder}>
              <RotateCcw className="size-4" /> {busy === "reorder" ? "Adding…" : "Order again"}
            </Button>
          </div>
        </div>

        <aside className="rounded-3xl border border-border/60 bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatGhs(order.subtotal_kobo)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{order.delivery_fee_kobo === 0 ? "Free" : formatGhs(order.delivery_fee_kobo)}</dd></div>
            {order.discount_kobo > 0 && <div className="flex justify-between text-primary"><dt>Discount</dt><dd className="tabular-nums">− {formatGhs(order.discount_kobo)}</dd></div>}
            <div className="flex justify-between border-t border-border/60 pt-2 text-base font-bold">
              <dt>Total</dt><dd className="text-primary tabular-nums">{formatGhs(order.total_kobo)}</dd>
            </div>
          </dl>
          {liveStatus === "PENDING" && (
            <button
              onClick={cancel}
              disabled={busy === "cancel"}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              <XCircle className="size-4" /> {busy === "cancel" ? "Cancelling…" : "Cancel order"}
            </button>
          )}
        </aside>
      </div>

      {/* Activity log */}
      {history.length > 0 && (
        <div className="mt-6 rounded-3xl border border-border/60 bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
          <ol className="mt-4 space-y-4">
            {history.map((h, i) => (
              <li key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-2.5 rounded-full ${i === 0 ? "bg-primary ring-4 ring-primary/15" : "bg-border"}`} />
                  {i < history.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-semibold">{STATUS_LABEL[h.status]}</p>
                  {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(h.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
