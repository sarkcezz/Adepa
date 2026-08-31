import type { Assumptions } from "@/lib/financial-model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Key = keyof Assumptions;

function Field({
  label, value, field, onChange, suffix, step = "1",
}: {
  label: string; value: number; field: Key; onChange: (field: Key, value: number) => void; suffix?: string; step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(field, e.target.value === "" ? 0 : Number(e.target.value))}
          className="h-9 pr-10 text-sm tabular-nums"
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export function InputsPanel({ assumptions, onChange }: { assumptions: Assumptions; onChange: (field: Key, value: number) => void }) {
  const shareSum = assumptions.whole_pig_share_pct + assumptions.raw_pork_share_pct + assumptions.spiced_pork_share_pct;

  return (
    <div className="space-y-6 rounded-3xl border border-border/60 bg-card p-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Assumptions</h2>
        <p className="text-xs text-muted-foreground">Edit any figure — every chart, KPI, and table updates immediately.</p>
      </div>

      <Section title="Production (per month)">
        <Field label="Pigs processed" value={assumptions.pigs_purchased_per_month} field="pigs_purchased_per_month" onChange={onChange} suffix="pigs" />
        <Field label="Avg. live weight" value={assumptions.avg_live_weight_kg} field="avg_live_weight_kg" onChange={onChange} suffix="kg" />
        <Field label="Carcass yield" value={assumptions.carcass_yield_pct} field="carcass_yield_pct" onChange={onChange} suffix="%" />
        <Field label="Retail yield" value={assumptions.retail_yield_pct} field="retail_yield_pct" onChange={onChange} suffix="%" />
        <Field label="Whole pig share" value={assumptions.whole_pig_share_pct} field="whole_pig_share_pct" onChange={onChange} suffix="%" />
        <Field label="Raw pork share" value={assumptions.raw_pork_share_pct} field="raw_pork_share_pct" onChange={onChange} suffix="%" />
        <Field label="Spiced pork share" value={assumptions.spiced_pork_share_pct} field="spiced_pork_share_pct" onChange={onChange} suffix="%" />
        <div className="flex items-end">
          <p className={`text-xs ${shareSum === 100 ? "text-muted-foreground" : "font-semibold text-accent"}`}>
            Shares total {shareSum.toFixed(0)}% {shareSum !== 100 && "— auto-normalized to 100%"}
          </p>
        </div>
      </Section>

      <Section title="Pricing">
        <Field label="Whole pig price" value={assumptions.whole_pig_price} field="whole_pig_price" onChange={onChange} suffix="GHS" />
        <Field label="Raw pork price/kg" value={assumptions.raw_pork_price_per_kg} field="raw_pork_price_per_kg" onChange={onChange} suffix="GHS" />
        <Field label="Spiced pork price/kg" value={assumptions.spiced_pork_price_per_kg} field="spiced_pork_price_per_kg" onChange={onChange} suffix="GHS" />
      </Section>

      <Section title="Direct costs">
        <Field label="Purchase price/pig" value={assumptions.purchase_price_per_pig} field="purchase_price_per_pig" onChange={onChange} suffix="GHS" />
        <Field label="Slaughter cost/pig" value={assumptions.slaughter_cost_per_pig} field="slaughter_cost_per_pig" onChange={onChange} suffix="GHS" />
        <Field label="Packaging cost/kg" value={assumptions.packaging_cost_per_kg} field="packaging_cost_per_kg" onChange={onChange} suffix="GHS" step="0.1" />
        <Field label="Spice cost/kg" value={assumptions.spice_cost_per_kg} field="spice_cost_per_kg" onChange={onChange} suffix="GHS" step="0.1" />
      </Section>

      <Section title="Fixed monthly costs">
        <Field label="Freezer" value={assumptions.freezer_cost_per_month} field="freezer_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Labor" value={assumptions.labor_cost_per_month} field="labor_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Utilities" value={assumptions.utilities_cost_per_month} field="utilities_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Transport" value={assumptions.transport_cost_per_month} field="transport_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Admin overhead" value={assumptions.admin_overhead_per_month} field="admin_overhead_per_month" onChange={onChange} suffix="GHS" />
      </Section>

      <Section title="Financial">
        <Field label="Tax rate" value={assumptions.tax_rate_pct} field="tax_rate_pct" onChange={onChange} suffix="%" />
        <Field label="Discount rate" value={assumptions.discount_rate_pct} field="discount_rate_pct" onChange={onChange} suffix="%" />
        <Field label="Starting cash" value={assumptions.starting_cash} field="starting_cash" onChange={onChange} suffix="GHS" />
      </Section>
    </div>
  );
}
