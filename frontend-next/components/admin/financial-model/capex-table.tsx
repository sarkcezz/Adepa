import { Plus, Trash2 } from "lucide-react";
import type { CapexAsset } from "@/lib/financial-model";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

let nextId = 1000;

export function CapexTable({ capex, onChange }: { capex: CapexAsset[]; onChange: (capex: CapexAsset[]) => void }) {
  function update<K extends keyof CapexAsset>(id: string, field: K, value: CapexAsset[K]) {
    onChange(capex.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  function addRow() {
    onChange([
      ...capex,
      {
        id: `cap-new-${nextId++}`,
        asset_name: "New asset",
        asset_category: "Other",
        purchase_month: 1,
        purchase_cost: 0,
        useful_life_months: 36,
        salvage_value: 0,
        depreciation_method: "STRAIGHT_LINE",
      },
    ]);
  }

  function removeRow(id: string) {
    onChange(capex.filter((a) => a.id !== id));
  }

  const total = capex.reduce((s, a) => s + a.purchase_cost, 0);

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Startup CAPEX</h2>
          <p className="text-xs text-muted-foreground">One-time assets — drives the depreciation charged each month.</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-full" onClick={addRow}>
          <Plus className="size-3.5" /> Add asset
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="pb-2 pr-2 font-semibold">Asset</th>
              <th className="pb-2 pr-2 font-semibold">Category</th>
              <th className="pb-2 pr-2 text-right font-semibold">Cost (GHS)</th>
              <th className="pb-2 pr-2 text-right font-semibold">Life (mo)</th>
              <th className="pb-2 pr-2 text-right font-semibold">Salvage</th>
              <th className="pb-2 pr-2 text-right font-semibold">Purchase mo.</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {capex.map((a) => (
              <tr key={a.id} className="border-t border-border/60">
                <td className="py-1.5 pr-2">
                  <Input className="h-8 text-sm" value={a.asset_name} onChange={(e) => update(a.id, "asset_name", e.target.value)} />
                </td>
                <td className="py-1.5 pr-2">
                  <Input className="h-8 text-sm" value={a.asset_category} onChange={(e) => update(a.id, "asset_category", e.target.value)} />
                </td>
                <td className="py-1.5 pr-2">
                  <Input type="number" className="h-8 text-right text-sm tabular-nums" value={a.purchase_cost} onChange={(e) => update(a.id, "purchase_cost", Number(e.target.value) || 0)} />
                </td>
                <td className="py-1.5 pr-2">
                  <Input type="number" className="h-8 text-right text-sm tabular-nums" value={a.useful_life_months} onChange={(e) => update(a.id, "useful_life_months", Number(e.target.value) || 1)} />
                </td>
                <td className="py-1.5 pr-2">
                  <Input type="number" className="h-8 text-right text-sm tabular-nums" value={a.salvage_value} onChange={(e) => update(a.id, "salvage_value", Number(e.target.value) || 0)} />
                </td>
                <td className="py-1.5 pr-2">
                  <Input type="number" min={1} className="h-8 text-right text-sm tabular-nums" value={a.purchase_month} onChange={(e) => update(a.id, "purchase_month", Math.max(1, Number(e.target.value) || 1))} />
                </td>
                <td className="py-1.5">
                  <button onClick={() => removeRow(a.id)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove asset">
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {capex.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">No startup assets yet.</td>
              </tr>
            )}
          </tbody>
          {capex.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Total</td>
                <td />
                <td className="pt-2 text-right text-sm font-bold tabular-nums text-primary">{total.toLocaleString("en-GH")}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
