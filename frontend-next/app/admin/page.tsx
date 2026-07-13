"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ShoppingBag, TrendingUp, Users, Package, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";
import { MetricCard } from "@/components/admin/metric-card";
import { RevenueBars } from "@/components/admin/revenue-bars";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Summary {
  total_revenue_kobo: number;
  orders_today: number;
  orders_this_month: number;
  total_customers: number;
  active_products: number;
  pending_orders: number;
}

export default function AdminDashboard() {
  const token = useAuth((s) => s.token);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenue, setRevenue] = useState<{ label: string; revenue_kobo: number }[]>([]);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    api<Summary>("/admin/analytics/summary", { token }).then(setSummary).catch(() => {});
    api<{ data: { label: string; revenue_kobo: number }[] }>("/admin/analytics/revenue?period=daily", { token })
      .then((r) => setRevenue(r.data))
      .catch(() => {});
    api<Paginated<Order>>("/admin/orders?per_page=8", { token })
      .then((r) => setRecent(r.data))
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of Adepa Pork Hub.</p>
      </div>

      {/* KPIs */}
      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Revenue (all-time)" value={formatGhs(summary.total_revenue_kobo)} icon={DollarSign} />
          <MetricCard label="Orders today" value={summary.orders_today} icon={ShoppingBag} />
          <MetricCard label="Orders this month" value={summary.orders_this_month} icon={TrendingUp} />
          <MetricCard label="Customers" value={summary.total_customers} icon={Users} />
          <MetricCard label="Active products" value={summary.active_products} icon={Package} />
          <MetricCard label="Pending orders" value={summary.pending_orders} icon={AlertTriangle} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      )}

      {/* Revenue + recent */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Revenue (recent days)</h2>
          <RevenueBars data={revenue} />
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Latest orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              All <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border/60">
            {recent.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{formatGhs(o.total_kobo)}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </li>
            ))}
            {recent.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No orders yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
