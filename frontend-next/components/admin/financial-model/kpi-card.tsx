import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** KPI card for the financial model dashboard — supports "bad" conditional formatting (negative cash/profit). */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  bad = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  bad?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border p-5", bad ? "border-destructive/40 bg-destructive/5" : "border-border/60 bg-card")}>
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", bad ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" title={label}>
          {label}
        </p>
        <p className={cn("mt-0.5 truncate font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums", bad && "text-destructive")} title={value}>
          {value}
        </p>
        {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
