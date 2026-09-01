import { CircleHelp } from "lucide-react";
import type { Assumptions } from "@/lib/financial-model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Key = keyof Assumptions;

function Field({
  label, help, value, field, onChange, suffix, step = "1",
}: {
  label: string; help: string; value: number; field: Key; onChange: (field: Key, value: number) => void; suffix?: string; step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        <Tooltip>
          <TooltipTrigger
            render={
              <button type="button" className="text-muted-foreground/70 hover:text-primary" aria-label={`What is "${label}"?`}>
                <CircleHelp className="size-3" />
              </button>
            }
          />
          <TooltipContent>{help}</TooltipContent>
        </Tooltip>
      </Label>
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
        <Field label="Pigs processed" help="How many pigs are slaughtered and processed each month." value={assumptions.pigs_purchased_per_month} field="pigs_purchased_per_month" onChange={onChange} suffix="pigs" />
        <Field label="Avg. live weight" help="Average live weight of one pig before slaughter." value={assumptions.avg_live_weight_kg} field="avg_live_weight_kg" onChange={onChange} suffix="kg" />
        <Field label="Carcass yield" help="Share of a pig's live weight that remains as carcass after slaughter — the dressing percentage." value={assumptions.carcass_yield_pct} field="carcass_yield_pct" onChange={onChange} suffix="%" />
        <Field label="Retail yield" help="Share of the carcass that becomes saleable meat after trimming and deboning." value={assumptions.retail_yield_pct} field="retail_yield_pct" onChange={onChange} suffix="%" />
        <Field label="Whole pig share" help="Share of processed pigs sold whole rather than cut up." value={assumptions.whole_pig_share_pct} field="whole_pig_share_pct" onChange={onChange} suffix="%" />
        <Field label="Raw pork share" help="Share of saleable meat sold as raw, unspiced cuts." value={assumptions.raw_pork_share_pct} field="raw_pork_share_pct" onChange={onChange} suffix="%" />
        <Field label="Spiced pork share" help="Share of saleable meat sold as spiced or marinated product." value={assumptions.spiced_pork_share_pct} field="spiced_pork_share_pct" onChange={onChange} suffix="%" />
        <div className="flex items-end">
          <p className={`text-xs ${shareSum === 100 ? "text-muted-foreground" : "font-semibold text-accent"}`}>
            Shares total {shareSum.toFixed(0)}% {shareSum !== 100 && "— auto-normalized to 100%"}
          </p>
        </div>
      </Section>

      <Section title="Pricing">
        <Field label="Whole pig price" help="Selling price for one whole processed pig." value={assumptions.whole_pig_price} field="whole_pig_price" onChange={onChange} suffix="GHS" />
        <Field label="Raw pork price/kg" help="Selling price per kilogram of raw pork." value={assumptions.raw_pork_price_per_kg} field="raw_pork_price_per_kg" onChange={onChange} suffix="GHS" />
        <Field label="Spiced pork price/kg" help="Selling price per kilogram of spiced pork." value={assumptions.spiced_pork_price_per_kg} field="spiced_pork_price_per_kg" onChange={onChange} suffix="GHS" />
      </Section>

      <Section title="Direct costs">
        <Field label="Purchase price/pig" help="What you pay per live pig at purchase." value={assumptions.purchase_price_per_pig} field="purchase_price_per_pig" onChange={onChange} suffix="GHS" />
        <Field label="Slaughter cost/pig" help="Cost to slaughter and dress one pig." value={assumptions.slaughter_cost_per_pig} field="slaughter_cost_per_pig" onChange={onChange} suffix="GHS" />
        <Field label="Packaging cost/kg" help="Vacuum-sealing and packaging cost per kilogram of raw and spiced pork sold." value={assumptions.packaging_cost_per_kg} field="packaging_cost_per_kg" onChange={onChange} suffix="GHS" step="0.1" />
        <Field label="Spice cost/kg" help="Cost of spices and marinade per kilogram of spiced pork." value={assumptions.spice_cost_per_kg} field="spice_cost_per_kg" onChange={onChange} suffix="GHS" step="0.1" />
      </Section>

      <Section title="Fixed monthly costs">
        <Field label="Freezer" help="Monthly cost to run and maintain freezer storage." value={assumptions.freezer_cost_per_month} field="freezer_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Labor" help="Monthly wages for processing and stand staff." value={assumptions.labor_cost_per_month} field="labor_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Utilities" help="Monthly electricity, water, and other utilities." value={assumptions.utilities_cost_per_month} field="utilities_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Transport" help="Monthly delivery and transport costs." value={assumptions.transport_cost_per_month} field="transport_cost_per_month" onChange={onChange} suffix="GHS" />
        <Field label="Admin overhead" help="Monthly admin, rent, and other overhead not tied directly to production." value={assumptions.admin_overhead_per_month} field="admin_overhead_per_month" onChange={onChange} suffix="GHS" />
      </Section>

      <Section title="Financial">
        <Field label="Tax rate" help="Corporate tax applied to operating profit each month." value={assumptions.tax_rate_pct} field="tax_rate_pct" onChange={onChange} suffix="%" />
        <Field label="Discount rate" help="Annual rate for discounting future cash flows — reserved for NPV-style analysis." value={assumptions.discount_rate_pct} field="discount_rate_pct" onChange={onChange} suffix="%" />
        <Field label="Starting cash" help="Cash on hand at the start of month 1, before any revenue or costs." value={assumptions.starting_cash} field="starting_cash" onChange={onChange} suffix="GHS" />
      </Section>
    </div>
  );
}
