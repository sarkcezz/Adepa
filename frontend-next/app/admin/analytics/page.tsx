"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatGhs } from "@/lib/format";
import { RevenueBars } from "@/components/admin/revenue-bars";
import { Skeleton } from "@/components/ui/skeleton";

interface TopProduct { product_name: string; qty_sold: number; revenue_kobo: number }
interface EmpPerf { id: string; name: string; emp_code: string; orders: number; revenue_kobo: number }
interface TopCust { id: string; name: string; phone: string; orders: number; spend_kobo: number }
interface CampPerf { id: string; code: string; name: string; usage_count: number; discount_kobo: number; is_active: boolean }

export default function AdminAnalyticsPage() {
  const token = useAuth((s) => s.token);
  const [period, setPeriod] = useState("daily");
  const [revenue, setRevenue] = useState<{ label: string; revenue_kobo: number }[]>([]);
  const [products, setProducts] = useState<TopProduct[] | null>(null);
  const [emps, setEmps] = useState<EmpPerf[]>([]);
  const [custs, setCusts] = useState<TopCust[]>([]);
  const [camps, setCamps] = useState<CampPerf[]>([]);

  useEffect(() => {
    if (!token) return;
    api<{ data: { label: string; revenue_kobo: number }[] }>(`/admin/analytics/revenue?period=${period}`, { token }).then((r) => setRevenue(r.data)).catch(() => {});
  }, [token, period]);

  useEffect(() => {
    if (!token) return;
    api<{ data: TopProduct[] }>("/admin/analytics/products", { token }).then((r) => setProducts(r.data)).catch(() => setProducts([]));
    api<{ data: EmpPerf[] }>("/admin/analytics/employees", { token }).then((r) => setEmps(r.data)).catch(() => {});
    api<{ data: TopCust[] }>("/admin/analytics/customers", { token }).then((r) => setCusts(r.data)).catch(() => {});
    api<{ data: CampPerf[] }>("/admin/analytics/campaigns", { token }).then((r) => setCamps(r.data)).catch(() => {});
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Analytics</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Revenue</h2>
        <RevenueBars data={revenue} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top products">
          <Table head={["Product", "Sold", "Revenue"]} rows={(products ?? []).map((p) => [p.product_name, String(p.qty_sold), formatGhs(p.revenue_kobo)])} loading={products === null} empty="No sales yet." />
        </Panel>
        <Panel title="Top customers">
          <Table head={["Name", "Orders", "Spend"]} rows={custs.map((c) => [c.name, String(c.orders), formatGhs(c.spend_kobo)])} empty="No data yet." />
        </Panel>
        <Panel title="Employee performance">
          <Table head={["Employee", "Orders", "Revenue"]} rows={emps.map((e) => [`${e.name} (${e.emp_code})`, String(e.orders), formatGhs(e.revenue_kobo)])} empty="No employee sales." />
        </Panel>
        <Panel title="Campaign performance">
          <Table head={["Code", "Used", "Discount"]} rows={camps.map((c) => [c.code, String(c.usage_count), formatGhs(c.discount_kobo)])} empty="No campaigns yet." />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Table({ head, rows, loading, empty }: { head: string[]; rows: string[][]; loading?: boolean; empty: string }) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>;
  if (rows.length === 0) return <p className="py-6 text-sm text-muted-foreground">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase text-muted-foreground">
        <tr>{head.map((h, i) => <th key={h} className={`pb-2 font-semibold ${i > 0 ? "text-right" : ""}`}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className="border-t border-border/60">
            {r.map((cell, ci) => (
              <td key={ci} className={`py-2 ${ci > 0 ? "text-right tabular-nums" : "font-medium"} ${ci === r.length - 1 ? "font-semibold text-primary" : ""}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
