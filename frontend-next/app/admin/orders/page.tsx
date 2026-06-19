"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs, formatDate } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/order";
import type { Order, OrderStatus, Paginated } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function AdminOrdersPage() {
  const token = useAuth((s) => s.token);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debounced = useDebounced(search);

  function load() {
    if (!token) return;
    setOrders(null);
    const params = new URLSearchParams();
    if (debounced) params.set("q", debounced);
    if (statusFilter) params.set("status", statusFilter);
    api<Paginated<Order>>(`/admin/orders?${params}`, { token })
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }

  useEffect(load, [token, debounced, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      await api(`/admin/orders/${id}/status`, { method: "PATCH", token: token!, body: JSON.stringify({ status }) });
      setOrders((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
      toast.success("Status updated.");
    } catch {
      toast.error("Could not update status.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Orders</h1>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Order #, customer name, phone, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {orders === null ? (
          <div className="space-y-px p-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No orders match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const cust = (o as Order & { customer?: { name?: string; phone?: string } }).customer;
                  return (
                    <tr key={o.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        {cust?.name ?? "—"}
                        {cust?.phone && <div className="text-xs text-muted-foreground">{cust.phone}</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{formatGhs(o.total_kobo)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
