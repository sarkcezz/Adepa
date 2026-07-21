"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatGhs } from "@/lib/format";

interface Row {
  label: string;
  revenue_kobo: number;
}

/** Revenue trend line, backed by real analytics data. */
export function RevenueBars({ data }: { data: Row[] }) {
  if (!data.length) {
    return <p className="grid h-64 place-items-center text-sm text-muted-foreground">No revenue data yet.</p>;
  }

  const recent = data.slice(-14).map((d) => ({ label: d.label, ghs: d.revenue_kobo / 100 }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={recent} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => `₵${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "0.75rem",
              fontSize: "0.8rem",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(value) => [formatGhs(Number(value) * 100), "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="ghs"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
