"use client";

import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import type { MonthlyResult } from "@/lib/financial-model";
import { formatGhsAmount } from "@/lib/financial-model";

const tickGhs = (v: number) => `₵${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;

export function RevenueProfitChart({ months }: { months: MonthlyResult[] }) {
  const data = months.map((m) => ({ month: `M${m.month}`, Revenue: m.total_revenue, "Gross profit": m.gross_profit, "Net profit": m.net_profit }));

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Revenue &amp; profit</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fmRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={48} tickFormatter={tickGhs} />
            <Tooltip
              cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
              contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "0.75rem", fontSize: "0.8rem" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(value) => formatGhsAmount(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#fmRevenueFill)" />
            <Line type="monotone" dataKey="Gross profit" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Net profit" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CashFlowChart({ months }: { months: MonthlyResult[] }) {
  const data = months.map((m) => ({ month: `M${m.month}`, "Closing cash": Math.round(m.closing_cash) }));
  const hasNegative = data.some((d) => d["Closing cash"] < 0);

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Cash position
        {hasNegative && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-destructive">Goes negative</span>}
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={48} tickFormatter={tickGhs} />
            <Tooltip
              cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
              contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "0.75rem", fontSize: "0.8rem" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(value) => formatGhsAmount(Number(value))}
            />
            <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Closing cash" stroke={hasNegative ? "var(--destructive)" : "var(--primary)"} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
