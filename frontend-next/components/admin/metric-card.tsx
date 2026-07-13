import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" title={label}>
          {label}
        </p>
        <p className="mt-0.5 truncate font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums" title={String(value)}>
          {value}
        </p>
      </div>
    </div>
  );
}
