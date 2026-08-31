"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Percent, Target, Clock, Wallet, RotateCcw, Save, Trash2,
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

const STORAGE_KEY = "adepa-financial-model-scenarios";
const HORIZONS = [12, 24, 36] as const;

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
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setScenarios(loadScenarios());
    setMounted(true);
  }, []);

  const result = useMemo(() => runModel(assumptions, capex, horizon), [assumptions, capex, horizon]);
  const { kpis, months } = result;

  function updateAssumption(field: keyof Assumptions, value: number) {
    setAssumptions((prev) => ({ ...prev, [field]: value }));
  }

  function saveScenario() {
    const name = scenarioName.trim();
    if (!name) return toast.error("Name this scenario first.");
    const next = [...scenarios.filter((s) => s.name !== name), { name, assumptions, capex }];
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast.success(`Saved "${name}".`);
    setScenarioName("");
  }

  function loadScenario(s: Scenario) {
    setAssumptions(s.assumptions);
    setCapex(s.capex);
    toast.success(`Loaded "${s.name}".`);
  }

  function deleteScenario(name: string) {
    const next = scenarios.filter((s) => s.name !== name);
    setScenarios(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function resetDefaults() {
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setCapex(DEFAULT_CAPEX);
    toast.success("Reset to default assumptions.");
  }

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

      {/* Scenarios */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
        <span className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scenarios</span>
        {scenarios.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-xs font-semibold">
            <button onClick={() => loadScenario(s)} className="hover:text-primary">{s.name}</button>
            <button onClick={() => deleteScenario(s.name)} className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${s.name}`}>
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="Scenario name" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className="h-8 w-40 text-xs" />
          <Button size="sm" className="rounded-full" onClick={saveScenario}>
            <Save className="size-3.5" /> Save current
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total revenue" value={formatGhsAmount(kpis.total_revenue)} sub={`Over ${horizon} months`} icon={DollarSign} />
        <KpiCard label="Gross profit" value={formatGhsAmount(kpis.gross_profit)} icon={TrendingUp} />
        <KpiCard label="Net profit" value={formatGhsAmount(kpis.net_profit)} icon={kpis.net_profit >= 0 ? TrendingUp : TrendingDown} bad={kpis.net_profit < 0} />
        <KpiCard label="Gross margin" value={`${kpis.gross_margin_pct.toFixed(1)}%`} icon={Percent} />
        <KpiCard label="Net margin" value={`${kpis.net_margin_pct.toFixed(1)}%`} icon={Percent} bad={kpis.net_margin_pct < 0} />
        <KpiCard label="Break-even sales" value={formatGhsAmount(kpis.break_even_revenue_per_month)} sub="Per month" icon={Target} />
        <KpiCard
          label="Cash runway"
          value={kpis.cash_runway_months ? `${kpis.cash_runway_months} mo` : "No limit"}
          sub={kpis.cash_runway_months ? "Until cash goes negative" : `Positive through month ${horizon}`}
          icon={Clock}
          bad={!!kpis.cash_runway_months}
        />
        <KpiCard
          label="CAPEX payback"
          value={kpis.capex_payback_months ? `${kpis.capex_payback_months} mo` : `> ${horizon} mo`}
          sub={formatGhsAmount(kpis.total_capex) + " invested"}
          icon={Wallet}
          bad={!kpis.capex_payback_months}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueProfitChart months={months} />
        <CashFlowChart months={months} />
      </div>

      {/* Assumptions + CAPEX */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InputsPanel assumptions={assumptions} onChange={updateAssumption} />
        <CapexTable capex={capex} onChange={setCapex} />
      </div>

      {/* Detail table */}
      <div className="rounded-3xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold capitalize">{view} breakdown</h2>
        <ResultsTable months={months} view={view} />
      </div>
    </div>
  );
}
