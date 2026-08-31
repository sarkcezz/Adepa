import type { MonthlyResult } from "@/lib/financial-model";
import { rollUpAnnual, formatGhsAmount } from "@/lib/financial-model";
import { cn } from "@/lib/utils";

function Cell({ value, bold = false }: { value: number; bold?: boolean }) {
  return (
    <td className={cn("py-2 pr-4 text-right tabular-nums", bold && "font-bold", value < 0 && "text-destructive")}>
      {formatGhsAmount(value)}
    </td>
  );
}

export function ResultsTable({ months, view }: { months: MonthlyResult[]; view: "monthly" | "annual" }) {
  if (view === "annual") {
    const years = rollUpAnnual(months);
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="pb-2 pr-4 font-semibold">Year</th>
              <th className="pb-2 pr-4 text-right font-semibold">Revenue</th>
              <th className="pb-2 pr-4 text-right font-semibold">Gross profit</th>
              <th className="pb-2 pr-4 text-right font-semibold">Net profit</th>
              <th className="pb-2 pr-4 text-right font-semibold">Closing cash</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y.year} className="border-t border-border/60">
                <td className="py-2 pr-4 font-semibold">Year {y.year}</td>
                <Cell value={y.total_revenue} />
                <Cell value={y.gross_profit} />
                <Cell value={y.net_profit} bold />
                <Cell value={y.closing_cash} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="sticky top-0 bg-card text-left text-[11px] uppercase text-muted-foreground">
          <tr>
            <th className="pb-2 pr-4 font-semibold">Month</th>
            <th className="pb-2 pr-4 text-right font-semibold">Revenue</th>
            <th className="pb-2 pr-4 text-right font-semibold">Direct costs</th>
            <th className="pb-2 pr-4 text-right font-semibold">Fixed opex</th>
            <th className="pb-2 pr-4 text-right font-semibold">Depreciation</th>
            <th className="pb-2 pr-4 text-right font-semibold">Net profit</th>
            <th className="pb-2 pr-4 text-right font-semibold">Closing cash</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month} className="border-t border-border/60">
              <td className="py-2 pr-4 font-semibold">M{m.month}</td>
              <Cell value={m.total_revenue} />
              <Cell value={-m.direct_costs} />
              <Cell value={-m.fixed_opex} />
              <Cell value={-m.depreciation} />
              <Cell value={m.net_profit} bold />
              <Cell value={m.closing_cash} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
