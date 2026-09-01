import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tiny inline trend line — normalizes an arbitrary value series to a fixed-height sparkline. */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 200;
  const h = 36;
  const step = w / (points.length - 1);
  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-1">
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** KPI card for the financial model dashboard — supports a trend sparkline, a highlighted "hero" variant, and "bad" conditional formatting (negative cash/profit). */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  bad = false,
  good = false,
  highlight = false,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  bad?: boolean;
  good?: boolean;
  highlight?: boolean;
  trend?: number[];
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5",
        highlight
          ? "border-transparent bg-primary text-primary-foreground shadow-md"
          : bad
            ? "border-destructive/40 bg-destructive/5"
            : good
              ? "border-transparent bg-[color:var(--chart-3)]/[0.1]"
              : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "truncate text-[11px] font-semibold uppercase tracking-wider",
            highlight ? "text-primary-foreground/75" : bad ? "text-destructive/80" : good ? "text-[color:var(--chart-3)]" : "text-muted-foreground",
          )}
          title={label}
        >
          {label}
        </p>
        <Icon className={cn("size-4 shrink-0", highlight ? "text-primary-foreground/70" : bad ? "text-destructive" : good ? "text-[color:var(--chart-3)]" : "text-muted-foreground")} />
      </div>
      <div className="min-w-0">
        <p
          className={cn("truncate font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums", bad && "text-destructive", good && "text-[color:var(--chart-3)]")}
          title={value}
        >
          {value}
        </p>
        {sub && (
          <p className={cn("mt-0.5 truncate text-xs", highlight ? "text-primary-foreground/70" : bad ? "text-destructive/70" : good ? "text-[color:var(--chart-3)]/80" : "text-muted-foreground")}>
            {sub}
          </p>
        )}
      </div>
      {trend && trend.length > 1 && (
        <Sparkline points={trend} color={highlight ? "var(--primary-foreground)" : bad ? "var(--destructive)" : good ? "var(--chart-3)" : "var(--accent)"} />
      )}
    </div>
  );
}
