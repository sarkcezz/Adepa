/**
 * Adepa financial planning model — pure calculation engine.
 *
 * Forecasts costs, revenue, profit, and cash flow for the pork processing
 * business from a set of editable assumptions. Deliberately has zero
 * dependency on auth/DB/network: it's a client-side "what-if" calculator
 * (see the Adepa Pork Hub Model Specification), not a ledger of actual
 * transactions — those already live in the real orders/products tables.
 * All money fields are plain GHS (not kobo) to match how the spec's
 * assumptions are naturally entered (e.g. "1800" for a pig, not "180000").
 */

export interface Assumptions {
  // Production
  pigs_purchased_per_month: number;
  avg_live_weight_kg: number;
  carcass_yield_pct: number; // 0-100
  retail_yield_pct: number; // 0-100
  whole_pig_share_pct: number; // 0-100, these three should sum to 100
  raw_pork_share_pct: number;
  spiced_pork_share_pct: number;

  // Pricing
  whole_pig_price: number;
  raw_pork_price_per_kg: number;
  spiced_pork_price_per_kg: number;

  // Direct (variable) costs
  purchase_price_per_pig: number;
  slaughter_cost_per_pig: number;
  packaging_cost_per_kg: number;
  spice_cost_per_kg: number;

  // Fixed monthly opex
  freezer_cost_per_month: number;
  labor_cost_per_month: number;
  utilities_cost_per_month: number;
  transport_cost_per_month: number;
  admin_overhead_per_month: number;

  // Financial
  tax_rate_pct: number; // 0-100
  discount_rate_pct: number; // 0-100, annual — reserved for NPV-style analysis
  starting_cash: number;
}

export type DepreciationMethod = "STRAIGHT_LINE";

export interface CapexAsset {
  id: string;
  asset_name: string;
  asset_category: string;
  purchase_month: number; // 1-based index into the forecast horizon
  purchase_cost: number;
  useful_life_months: number;
  salvage_value: number;
  depreciation_method: DepreciationMethod;
}

export interface MonthlyResult {
  month: number;
  // Production
  pigs_processed: number;
  carcass_kg: number;
  saleable_kg: number;
  whole_pigs_sold: number;
  kg_raw_pork: number;
  kg_spiced_pork: number;
  // Revenue
  whole_pig_revenue: number;
  raw_pork_revenue: number;
  spiced_pork_revenue: number;
  total_revenue: number;
  // Costs
  pig_purchase_cost: number;
  slaughter_cost: number;
  packaging_cost: number;
  spice_cost: number;
  direct_costs: number;
  fixed_opex: number;
  depreciation: number;
  // Profit
  gross_profit: number;
  operating_profit: number;
  tax: number;
  net_profit: number;
  // Cash
  capex_cash_outflow: number;
  operating_cash_inflow: number;
  operating_cash_outflow: number;
  opening_cash: number;
  closing_cash: number;
}

export interface ModelResult {
  months: MonthlyResult[];
  kpis: {
    total_revenue: number;
    gross_profit: number;
    net_profit: number;
    gross_margin_pct: number;
    net_margin_pct: number;
    break_even_revenue_per_month: number;
    cash_runway_months: number | null; // null = never runs out within horizon
    capex_payback_months: number | null; // null = never pays back within horizon
    total_capex: number;
  };
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  pigs_purchased_per_month: 40,
  avg_live_weight_kg: 90,
  carcass_yield_pct: 72,
  retail_yield_pct: 85,
  whole_pig_share_pct: 20,
  raw_pork_share_pct: 55,
  spiced_pork_share_pct: 25,

  whole_pig_price: 2800,
  raw_pork_price_per_kg: 85,
  spiced_pork_price_per_kg: 120,

  purchase_price_per_pig: 1800,
  slaughter_cost_per_pig: 150,
  packaging_cost_per_kg: 3,
  spice_cost_per_kg: 8,

  freezer_cost_per_month: 2500,
  labor_cost_per_month: 12000,
  utilities_cost_per_month: 3000,
  transport_cost_per_month: 4000,
  admin_overhead_per_month: 2500,

  tax_rate_pct: 25,
  discount_rate_pct: 15,
  // Covers the 340,000 in default startup CAPEX (all purchased in month 1)
  // plus a working-capital buffer, so the baseline scenario reads as a
  // credibly funded launch rather than an immediate cash crunch — admins can
  // still dial this down to stress-test a leaner starting position.
  starting_cash: 450000,
};

export const DEFAULT_CAPEX: CapexAsset[] = [
  { id: "cap-1", asset_name: "Freezer units", asset_category: "Cold storage", purchase_month: 1, purchase_cost: 60000, useful_life_months: 60, salvage_value: 6000, depreciation_method: "STRAIGHT_LINE" },
  { id: "cap-2", asset_name: "Vacuum sealers", asset_category: "Packaging", purchase_month: 1, purchase_cost: 15000, useful_life_months: 48, salvage_value: 1000, depreciation_method: "STRAIGHT_LINE" },
  { id: "cap-3", asset_name: "Processing machinery", asset_category: "Machinery", purchase_month: 1, purchase_cost: 120000, useful_life_months: 84, salvage_value: 12000, depreciation_method: "STRAIGHT_LINE" },
  { id: "cap-4", asset_name: "Generator", asset_category: "Utilities", purchase_month: 1, purchase_cost: 35000, useful_life_months: 60, salvage_value: 3500, depreciation_method: "STRAIGHT_LINE" },
  { id: "cap-5", asset_name: "Delivery vehicle", asset_category: "Vehicles", purchase_month: 1, purchase_cost: 90000, useful_life_months: 60, salvage_value: 15000, depreciation_method: "STRAIGHT_LINE" },
  { id: "cap-6", asset_name: "Installation & setup", asset_category: "Installation", purchase_month: 1, purchase_cost: 20000, useful_life_months: 60, salvage_value: 0, depreciation_method: "STRAIGHT_LINE" },
];

/** Straight-line monthly depreciation for one asset, 0 outside its useful life. */
export function monthlyDepreciation(asset: CapexAsset, month: number): number {
  if (month < asset.purchase_month) return 0;
  if (month >= asset.purchase_month + asset.useful_life_months) return 0;
  if (asset.useful_life_months <= 0) return 0;
  return (asset.purchase_cost - asset.salvage_value) / asset.useful_life_months;
}

/** Runs the full month-by-month model over the given horizon. */
export function runModel(assumptions: Assumptions, capex: CapexAsset[], horizonMonths: number): ModelResult {
  const shareSum = assumptions.whole_pig_share_pct + assumptions.raw_pork_share_pct + assumptions.spiced_pork_share_pct;
  const norm = shareSum > 0 ? 100 / shareSum : 0;
  const wholeShare = (assumptions.whole_pig_share_pct * norm) / 100;
  const rawShare = (assumptions.raw_pork_share_pct * norm) / 100;
  const spicedShare = (assumptions.spiced_pork_share_pct * norm) / 100;

  const months: MonthlyResult[] = [];
  let openingCash = assumptions.starting_cash;
  let cumulativeNetCashFlow = -0; // tracks recovery of CAPEX for payback

  for (let month = 1; month <= horizonMonths; month++) {
    const pigsProcessed = assumptions.pigs_purchased_per_month;
    const carcassKg = pigsProcessed * assumptions.avg_live_weight_kg * (assumptions.carcass_yield_pct / 100);
    const saleableKg = carcassKg * (assumptions.retail_yield_pct / 100);

    const wholePigsSold = Math.round(pigsProcessed * wholeShare);
    const kgRawPork = saleableKg * rawShare;
    const kgSpicedPork = saleableKg * spicedShare;

    const wholePigRevenue = wholePigsSold * assumptions.whole_pig_price;
    const rawPorkRevenue = kgRawPork * assumptions.raw_pork_price_per_kg;
    const spicedPorkRevenue = kgSpicedPork * assumptions.spiced_pork_price_per_kg;
    const totalRevenue = wholePigRevenue + rawPorkRevenue + spicedPorkRevenue;

    const pigPurchaseCost = pigsProcessed * assumptions.purchase_price_per_pig;
    const slaughterCost = pigsProcessed * assumptions.slaughter_cost_per_pig;
    const packagingCost = (kgRawPork + kgSpicedPork) * assumptions.packaging_cost_per_kg;
    const spiceCost = kgSpicedPork * assumptions.spice_cost_per_kg;
    const directCosts = pigPurchaseCost + slaughterCost + packagingCost + spiceCost;

    const fixedOpex =
      assumptions.labor_cost_per_month +
      assumptions.utilities_cost_per_month +
      assumptions.transport_cost_per_month +
      assumptions.admin_overhead_per_month +
      assumptions.freezer_cost_per_month;

    const depreciation = capex.reduce((sum, a) => sum + monthlyDepreciation(a, month), 0);

    const grossProfit = totalRevenue - directCosts;
    const operatingProfit = grossProfit - fixedOpex - depreciation;
    const tax = Math.max(0, operatingProfit) * (assumptions.tax_rate_pct / 100);
    const netProfit = operatingProfit - tax;

    const capexCashOutflow = capex.filter((a) => a.purchase_month === month).reduce((sum, a) => sum + a.purchase_cost, 0);
    const operatingCashInflow = totalRevenue;
    const operatingCashOutflow = directCosts + fixedOpex + tax;
    const closingCash = openingCash + operatingCashInflow - operatingCashOutflow - capexCashOutflow;

    cumulativeNetCashFlow += operatingCashInflow - operatingCashOutflow - capexCashOutflow;

    months.push({
      month,
      pigs_processed: pigsProcessed,
      carcass_kg: carcassKg,
      saleable_kg: saleableKg,
      whole_pigs_sold: wholePigsSold,
      kg_raw_pork: kgRawPork,
      kg_spiced_pork: kgSpicedPork,
      whole_pig_revenue: wholePigRevenue,
      raw_pork_revenue: rawPorkRevenue,
      spiced_pork_revenue: spicedPorkRevenue,
      total_revenue: totalRevenue,
      pig_purchase_cost: pigPurchaseCost,
      slaughter_cost: slaughterCost,
      packaging_cost: packagingCost,
      spice_cost: spiceCost,
      direct_costs: directCosts,
      fixed_opex: fixedOpex,
      depreciation,
      gross_profit: grossProfit,
      operating_profit: operatingProfit,
      tax,
      net_profit: netProfit,
      capex_cash_outflow: capexCashOutflow,
      operating_cash_inflow: operatingCashInflow,
      operating_cash_outflow: operatingCashOutflow,
      opening_cash: openingCash,
      closing_cash: closingCash,
    });

    openingCash = closingCash;
  }

  const totalRevenue = months.reduce((s, m) => s + m.total_revenue, 0);
  const grossProfit = months.reduce((s, m) => s + m.gross_profit, 0);
  const netProfit = months.reduce((s, m) => s + m.net_profit, 0);
  const totalCapex = capex.reduce((s, a) => s + a.purchase_cost, 0);
  const avgFixedOpex = months.length ? months.reduce((s, m) => s + m.fixed_opex + m.depreciation, 0) / months.length : 0;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Break-even revenue = fixed costs / gross margin (standard break-even-in-sales formula).
  const breakEvenRevenue = grossMarginPct > 0 ? avgFixedOpex / (grossMarginPct / 100) : 0;

  const firstNegativeCashMonth = months.find((m) => m.closing_cash < 0)?.month ?? null;

  let cumulative = 0;
  let paybackMonth: number | null = null;
  for (const m of months) {
    cumulative += m.net_profit + m.depreciation; // cash-basis recovery (add back non-cash depreciation)
    if (cumulative >= totalCapex) {
      paybackMonth = m.month;
      break;
    }
  }

  return {
    months,
    kpis: {
      total_revenue: totalRevenue,
      gross_profit: grossProfit,
      net_profit: netProfit,
      gross_margin_pct: grossMarginPct,
      net_margin_pct: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      break_even_revenue_per_month: breakEvenRevenue,
      cash_runway_months: firstNegativeCashMonth,
      capex_payback_months: paybackMonth,
      total_capex: totalCapex,
    },
  };
}

/** Rolls monthly results up into annual (12-month) buckets for the annual view. */
export function rollUpAnnual(months: MonthlyResult[]): { year: number; total_revenue: number; gross_profit: number; net_profit: number; closing_cash: number }[] {
  const years: { year: number; total_revenue: number; gross_profit: number; net_profit: number; closing_cash: number }[] = [];
  for (let i = 0; i < months.length; i += 12) {
    const chunk = months.slice(i, i + 12);
    years.push({
      year: Math.floor(i / 12) + 1,
      total_revenue: chunk.reduce((s, m) => s + m.total_revenue, 0),
      gross_profit: chunk.reduce((s, m) => s + m.gross_profit, 0),
      net_profit: chunk.reduce((s, m) => s + m.net_profit, 0),
      closing_cash: chunk[chunk.length - 1]?.closing_cash ?? 0,
    });
  }
  return years;
}

export function formatGhsAmount(amount: number): string {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
