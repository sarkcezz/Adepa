"use client";

import { formatGhs } from "@/lib/format";

interface Row {
  label: string;
  revenue_kobo: number;
}

/** Lightweight SVG bar chart — no charting dependency. */
export function RevenueBars({ data }: { data: Row[] }) {
  if (!data.length) {
    return <p className="grid h-48 place-items-center text-sm text-muted-foreground">No revenue data yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.revenue_kobo), 1);
  const recent = data.slice(-14); // last 14 points

  return (
    <div>
      <div className="flex h-48 items-end gap-1.5">
        {recent.map((d, i) => {
          const h = Math.max(2, (d.revenue_kobo / max) * 100);
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t-md bg-primary/80 transition-colors hover:bg-primary"
                style={{ height: `${h}%` }}
              />
              <div className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] font-medium text-background group-hover:block">
                {formatGhs(d.revenue_kobo)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{recent[0]?.label}</span>
        <span>{recent[recent.length - 1]?.label}</span>
      </div>
    </div>
  );
}
