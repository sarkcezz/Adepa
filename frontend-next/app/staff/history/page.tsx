"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs, formatDate } from "@/lib/format";
import type { Order, Paginated } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface Summary { today_count: number; today_total: number; week_total: number; month_total: number }

export default function StaffHistoryPage() {
  const token = useAuth((s) => s.token);
  const [sales, setSales] = useState<Order[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Paginated<Order>>("/orders/my-sales", { token }).then((r) => setSales(r.data)).catch(() => setSales([]));
    api<Summary>("/orders/my-sales/summary", { token }).then(setSummary).catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">My sales</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Sales today", summary ? String(summary.today_count) : "—"],
          ["Revenue today", summary ? formatGhs(summary.today_total) : "—"],
          ["This week", summary ? formatGhs(summary.week_total) : "—"],
          ["This month", summary ? formatGhs(summary.month_total) : "—"],
        ].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold tabular-nums">{val}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {sales === null ? (
          <div className="space-y-px p-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : sales.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <Receipt className="size-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3 font-semibold">Order</th><th className="px-4 py-3 font-semibold">Time</th><th className="px-4 py-3 font-semibold">Items</th><th className="px-4 py-3 font-semibold">Method</th><th className="px-4 py-3 font-semibold">Total</th><th /></tr>
              </thead>
              <tbody>
                {sales.map((o) => (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3 tabular-nums">{o.items?.length ?? 0}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{o.payment_method}</span></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatGhs(o.total_kobo)}</td>
                    <td className="px-2 py-3">
                      <Link href={`/staff/sale/${o.id}/receipt`} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-primary hover:bg-secondary">
                        <Printer className="size-3.5" /> Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
