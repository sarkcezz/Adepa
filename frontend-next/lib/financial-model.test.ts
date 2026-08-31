import { describe, it, expect } from "vitest";
import {
  runModel,
  monthlyDepreciation,
  rollUpAnnual,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_CAPEX,
  type Assumptions,
  type CapexAsset,
} from "./financial-model";

describe("monthlyDepreciation", () => {
  const asset: CapexAsset = {
    id: "a1",
    asset_name: "Test asset",
    asset_category: "Test",
    purchase_month: 3,
    purchase_cost: 12000,
    useful_life_months: 12,
    salvage_value: 1200,
    depreciation_method: "STRAIGHT_LINE",
  };

  it("is zero before the purchase month", () => {
    expect(monthlyDepreciation(asset, 1)).toBe(0);
    expect(monthlyDepreciation(asset, 2)).toBe(0);
  });

  it("is (cost - salvage) / life during the useful life", () => {
    expect(monthlyDepreciation(asset, 3)).toBeCloseTo(900); // (12000-1200)/12
    expect(monthlyDepreciation(asset, 14)).toBeCloseTo(900);
  });

  it("is zero once the useful life has elapsed", () => {
    expect(monthlyDepreciation(asset, 15)).toBe(0);
  });
});

describe("runModel", () => {
  it("produces one row per month over the horizon", () => {
    const result = runModel(DEFAULT_ASSUMPTIONS, DEFAULT_CAPEX, 12);
    expect(result.months).toHaveLength(12);
  });

  it("computes production from pigs processed", () => {
    const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, pigs_purchased_per_month: 10, avg_live_weight_kg: 100, carcass_yield_pct: 70, retail_yield_pct: 80 };
    const result = runModel(a, [], 1);
    const m = result.months[0];
    // carcass = 10 * 100 * 0.70 = 700; saleable = 700 * 0.80 = 560
    expect(m.carcass_kg).toBeCloseTo(700);
    expect(m.saleable_kg).toBeCloseTo(560);
  });

  it("normalizes product shares that don't sum to 100", () => {
    const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, whole_pig_share_pct: 10, raw_pork_share_pct: 10, spiced_pork_share_pct: 10 }; // sums to 30
    const result = runModel(a, [], 1);
    const m = result.months[0];
    // After normalizing to sum-100, each share is 1/3 of saleable kg (whole pigs measured in pig count instead)
    expect(m.kg_raw_pork).toBeCloseTo(m.kg_spiced_pork);
  });

  it("computes revenue as price × quantity per product line", () => {
    const a: Assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      pigs_purchased_per_month: 10,
      whole_pig_share_pct: 100,
      raw_pork_share_pct: 0,
      spiced_pork_share_pct: 0,
      whole_pig_price: 3000,
    };
    const result = runModel(a, [], 1);
    const m = result.months[0];
    expect(m.whole_pigs_sold).toBe(10);
    expect(m.whole_pig_revenue).toBe(30000);
    expect(m.total_revenue).toBe(m.whole_pig_revenue);
  });

  it("subtracts direct costs and fixed opex correctly for gross/operating profit", () => {
    const a: Assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      pigs_purchased_per_month: 0, // no production → no revenue, no direct costs
      labor_cost_per_month: 5000,
      utilities_cost_per_month: 1000,
      transport_cost_per_month: 500,
      admin_overhead_per_month: 500,
      freezer_cost_per_month: 1000,
    };
    const result = runModel(a, [], 1);
    const m = result.months[0];
    expect(m.total_revenue).toBe(0);
    expect(m.direct_costs).toBe(0);
    expect(m.fixed_opex).toBe(8000);
    expect(m.gross_profit).toBe(0);
    expect(m.operating_profit).toBe(-8000); // 0 - 8000 fixed - 0 depreciation
  });

  it("applies tax only to positive operating profit", () => {
    const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, pigs_purchased_per_month: 0, labor_cost_per_month: 1000, utilities_cost_per_month: 0, transport_cost_per_month: 0, admin_overhead_per_month: 0, freezer_cost_per_month: 0, tax_rate_pct: 25 };
    const result = runModel(a, [], 1);
    expect(result.months[0].operating_profit).toBeLessThan(0);
    expect(result.months[0].tax).toBe(0); // no tax on a loss
  });

  it("includes CAPEX as a cash outflow only in its purchase month", () => {
    const capex: CapexAsset[] = [{ id: "c1", asset_name: "Rig", asset_category: "Machinery", purchase_month: 2, purchase_cost: 10000, useful_life_months: 10, salvage_value: 0, depreciation_method: "STRAIGHT_LINE" }];
    const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, pigs_purchased_per_month: 0, labor_cost_per_month: 0, utilities_cost_per_month: 0, transport_cost_per_month: 0, admin_overhead_per_month: 0, freezer_cost_per_month: 0, starting_cash: 20000 };
    const result = runModel(a, capex, 3);
    expect(result.months[0].capex_cash_outflow).toBe(0);
    expect(result.months[1].capex_cash_outflow).toBe(10000);
    expect(result.months[2].capex_cash_outflow).toBe(0);
    // Depreciation is non-cash: closing cash should only drop by the CAPEX spend, not extra for depreciation.
    expect(result.months[1].closing_cash).toBeCloseTo(result.months[0].closing_cash - 10000);
  });

  it("chains opening cash from the prior month's closing cash", () => {
    const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, pigs_purchased_per_month: 0, labor_cost_per_month: 0, utilities_cost_per_month: 0, transport_cost_per_month: 0, admin_overhead_per_month: 0, freezer_cost_per_month: 0, starting_cash: 1000 };
    const result = runModel(a, [], 3);
    expect(result.months[0].opening_cash).toBe(1000);
    expect(result.months[1].opening_cash).toBe(result.months[0].closing_cash);
    expect(result.months[2].opening_cash).toBe(result.months[1].closing_cash);
  });

  it("flags cash runway at the first month cash goes negative", () => {
    const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, pigs_purchased_per_month: 0, labor_cost_per_month: 10000, utilities_cost_per_month: 0, transport_cost_per_month: 0, admin_overhead_per_month: 0, freezer_cost_per_month: 0, starting_cash: 25000 };
    const result = runModel(a, [], 12);
    // Loses 10000/month with no revenue: cash goes negative on month 3 (25000 - 10000*3 = -5000).
    expect(result.kpis.cash_runway_months).toBe(3);
  });

  it("reports no cash runway limit when cash never goes negative", () => {
    const result = runModel(DEFAULT_ASSUMPTIONS, [], 12);
    expect(result.kpis.cash_runway_months).toBeNull();
  });

  it("computes gross/net margin as a percentage of revenue", () => {
    const result = runModel(DEFAULT_ASSUMPTIONS, DEFAULT_CAPEX, 12);
    expect(result.kpis.gross_margin_pct).toBeGreaterThan(0);
    expect(result.kpis.gross_margin_pct).toBeLessThanOrEqual(100);
    expect(result.kpis.net_margin_pct).toBeLessThanOrEqual(result.kpis.gross_margin_pct);
  });
});

describe("rollUpAnnual", () => {
  it("buckets 24 months into 2 years", () => {
    const result = runModel(DEFAULT_ASSUMPTIONS, DEFAULT_CAPEX, 24);
    const years = rollUpAnnual(result.months);
    expect(years).toHaveLength(2);
    expect(years[0].total_revenue).toBeCloseTo(result.months.slice(0, 12).reduce((s, m) => s + m.total_revenue, 0));
  });
});
