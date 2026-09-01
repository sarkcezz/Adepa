"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Percent, Target, Clock, Wallet, RotateCcw, Save, Trash2, Plus, LayoutGrid, SlidersHorizontal, Boxes, Table2,
} from "lucide-react";
import { toast } from "sonner";
import {
  runModel, DEFAULT_ASSUMPTIONS, DEFAULT_CAPEX, formatGhsAmount,
  type Assumptions, type CapexAsset,
} from "@/lib/financial-model";
import { KpiCard } from "@/components/admin/financial-model/kpi-card";
import { InputsPanel } from "@/components/admin/financial-model/inputs-panel";
import { CapexTable } from "@/components/admin/financial-model/capex-table";
import { RevenueProfitChart, CashFlowChart } from "@/components/admin/financial-model/trend-charts";
import { ResultsTable } from "@/components/admin/financial-model/results-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const STORAGE_KEY = "adepa-financial-model-scenarios";
const HORIZONS = [12, 24, 36] as const;
const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "assumptions", label: "Assumptions", icon: SlidersHorizontal },
  { id: "capex", label: "Startup CAPEX", icon: Boxes },
  { id: "detail", label: "Detail", icon: Table2 },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

interface Scenario {
  name: string;
  assumptions: Assumptions;
  capex: CapexAsset[];
}

function loadScenarios(): Scenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Scenario[]) : [];
  } catch {
    return [];
  }
}

export default function FinancialModelPage() {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [capex, setCapex] = useState<CapexAsset[]>(DEFAULT_CAPEX);
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(24);
  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const [section, setSection] = useState<Section>("overview");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setScenarios(loadScenarios());
    setMounted(true);
  }, []);

  const result = useMemo(() => runModel(assumptions, capex, horizon), [assumptions, capex, horizon]);
  const { kpis, months } = result;

  function updateAssumption(field: keyof Assumptions, value: number) {
    setAssumptions((prev) => ({ ...prev, [field]: value }));
    setActiveScenario(null);
  }

  function updateCapex(next: CapexAsset[]) {
    setCapex(next);
    setActiveScenario(null);
  }

  function requestSave() {
    if (!scenarioName.trim()) return toast.error("Name this scenario first.");
    setConfirmSave(true);
  }

  function confirmSaveScenario() {
    const name = scenarioName.trim();
    const next = [...scenarios.filter((s) => s.name !== name), { name, assumptions, capex }];
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast.success(`Saved "${name}".`);
    setScenarioName("");
    setActiveScenario(name);
    setConfirmSave(false);
  }

  function loadScenario(s: Scenario) {
    setAssumptions(s.assumptions);
    setCapex(s.capex);
    setActiveScenario(s.name);
    toast.success(`Loaded "${s.name}".`);
  }

  function confirmDeleteScenario() {
    if (!confirmDelete) return;
    const next = scenarios.filter((s) => s.name !== confirmDelete);
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (activeScenario === confirmDelete) setActiveScenario(null);
    toast.success(`Deleted "${confirmDelete}".`);
    setConfirmDelete(null);
  }

  function resetDefaults() {
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setCapex(DEFAULT_CAPEX);
    setActiveScenario(null);
    toast.success("Reset to default assumptions.");
  }

  const overwriting = scenarios.some((s) => s.name === scenarioName.trim());

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Financial model</h1>
          <p className="text-sm text-muted-foreground">Forecast costs, revenue, profit, and cash flow — edit any assumption to see the impact live.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-secondary p-1">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${horizon === h ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {h} mo
              </button>
            ))}
          </div>
          <div className="flex rounded-full bg-secondary p-1">
            {(["monthly", "annual"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${view === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="rounded-full" onClick={resetDefaults}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Scenarios — tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-2">
        <button
          onClick={() => setActiveScenario(null)}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${activeScenario === null ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Current (unsaved)
        </button>
        {scenarios.map((s) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-1 rounded-full py-1 pl-4 pr-1 text-xs font-semibold transition-colors ${activeScenario === s.name ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            <button onClick={() => loadScenario(s)}>{s.name}</button>
            <button
              onClick={() => setConfirmDelete(s.name)}
              className={`grid size-6 place-items-center rounded-full ${activeScenario === s.name ? "hover:bg-primary-foreground/20" : "hover:bg-destructive/10 hover:text-destructive"}`}
              aria-label={`Delete ${s.name}`}
            >
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="Scenario name" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className="h-8 w-40 text-xs" />
          <Button size="sm" className="rounded-full" onClick={requestSave}>
            <Save className="size-3.5" /> Save current
          </Button>
        </div>
      </div>

      {/* KPIs — always visible regardless of section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total revenue"
          value={formatGhsAmount(kpis.total_revenue)}
          sub={`Over ${horizon} months`}
          icon={DollarSign}
          trend={months.map((m) => m.total_revenue)}
        />
        <KpiCard
          label="Gross profit"
          value={formatGhsAmount(kpis.gross_profit)}
          icon={TrendingUp}
          trend={months.map((m) => m.gross_profit)}
        />
        <KpiCard
          label="Net profit"
          value={formatGhsAmount(kpis.net_profit)}
          icon={kpis.net_profit >= 0 ? TrendingUp : TrendingDown}
          bad={kpis.net_profit < 0}
          highlight={kpis.net_profit >= 0}
          trend={months.map((m) => m.net_profit)}
        />
        <KpiCard
          label="Net margin"
          value={`${kpis.net_margin_pct.toFixed(1)}%`}
          icon={Percent}
          bad={kpis.net_margin_pct < 0}
          trend={months.map((m) => (m.total_revenue > 0 ? (m.net_profit / m.total_revenue) * 100 : 0))}
        />
        <KpiCard
          label="Gross margin"
          value={`${kpis.gross_margin_pct.toFixed(1)}%`}
          icon={Percent}
          trend={months.map((m) => (m.total_revenue > 0 ? (m.gross_profit / m.total_revenue) * 100 : 0))}
        />
        <KpiCard label="Break-even sales" value={formatGhsAmount(kpis.break_even_revenue_per_month)} sub="Per month, to cover fixed costs" icon={Target} />
        <KpiCard
          label="Cash runway"
          value={kpis.cash_runway_months ? `${kpis.cash_runway_months} mo` : "No limit"}
          sub={kpis.cash_runway_months ? "Until cash goes negative" : "Cash never goes negative"}
          icon={Clock}
          bad={!!kpis.cash_runway_months}
          good={!kpis.cash_runway_months}
        />
        <KpiCard
          label="CAPEX payback"
          value={kpis.capex_payback_months ? `${kpis.capex_payback_months} mo` : `> ${horizon} mo`}
          sub={formatGhsAmount(kpis.total_capex) + " invested"}
          icon={Wallet}
          bad={!kpis.capex_payback_months}
        />
      </div>

      {/* Section tabs — the page is split up so only one part shows at a time */}
      <div className="flex flex-wrap gap-1 rounded-full bg-secondary p-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="size-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {section === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueProfitChart months={months} />
          <CashFlowChart months={months} />
        </div>
      )}

      {section === "assumptions" && <InputsPanel assumptions={assumptions} onChange={updateAssumption} />}

      {section === "capex" && <CapexTable capex={capex} onChange={updateCapex} />}

      {section === "detail" && (
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold capitalize">{view} breakdown</h2>
          <ResultsTable months={months} view={view} />
        </div>
      )}

      {/* Save confirmation */}
      <Dialog open={confirmSave} onOpenChange={setConfirmSave}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Save scenario</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {overwriting ? (
                <>This will overwrite the existing scenario <strong className="text-foreground">&ldquo;{scenarioName.trim()}&rdquo;</strong> with the current assumptions.</>
              ) : (
                <>Save the current assumptions and CAPEX as <strong className="text-foreground">&ldquo;{scenarioName.trim()}&rdquo;</strong>?</>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setConfirmSave(false)}>Cancel</Button>
              <Button className="flex-1 rounded-full" onClick={confirmSaveScenario}>
                <Plus className="size-3.5" /> {overwriting ? "Overwrite" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Delete scenario</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete <strong className="text-foreground">&ldquo;{confirmDelete}&rdquo;</strong>? This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1 rounded-full" onClick={confirmDeleteScenario}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
