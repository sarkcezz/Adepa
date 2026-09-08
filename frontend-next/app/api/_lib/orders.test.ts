import { describe, it, expect } from "vitest";
import { discountKobo } from "./orders";
import { computeDeliveryFeeKobo } from "./shipping";

type Campaign = Parameters<typeof discountKobo>[0];
const campaign = (overrides: Partial<Campaign>): Campaign => ({ ...overrides } as Campaign);

describe("discountKobo", () => {
  it("computes a percent discount, rounded", () => {
    const c = campaign({ discount_type: "PERCENT", discount_value: 10 });
    expect(discountKobo(c, 17_000)).toBe(1_700);
    expect(discountKobo(c, 995)).toBe(100); // 99.5 -> rounds up
  });

  it("computes a fixed discount, capped at the subtotal", () => {
    const c = campaign({ discount_type: "FIXED", discount_value: 5_000 });
    expect(discountKobo(c, 17_000)).toBe(5_000);
    expect(discountKobo(c, 3_000)).toBe(3_000); // can't discount more than the order
  });

  it("gives zero direct discount for FREE_DELIVERY (fee waived elsewhere)", () => {
    const c = campaign({ discount_type: "FREE_DELIVERY", discount_value: 0 });
    expect(discountKobo(c, 17_000)).toBe(0);
  });
});

// The zone lookup + settings fetch (calculateDeliveryFeeKobo) now reads
// admin-configured values from the DB — covered by the shipping admin route
// tests instead. This suite covers just the fee math, DB-free.
describe("computeDeliveryFeeKobo", () => {
  const FREE_WEIGHT = 5_000;
  const SURCHARGE = 200;

  it("charges the zone's base fee under the free-weight allowance", () => {
    expect(computeDeliveryFeeKobo(1_000, 2_000, FREE_WEIGHT, SURCHARGE)).toBe(1_000);
    expect(computeDeliveryFeeKobo(1_700, 5_000, FREE_WEIGHT, SURCHARGE)).toBe(1_700);
  });

  it("adds a per-kg surcharge past the free weight allowance, rounding up", () => {
    expect(computeDeliveryFeeKobo(1_000, 5_000, FREE_WEIGHT, SURCHARGE)).toBe(1_000); // exactly at the allowance
    expect(computeDeliveryFeeKobo(1_000, 5_500, FREE_WEIGHT, SURCHARGE)).toBe(1_200); // 0.5kg over -> 1 extra kg
    expect(computeDeliveryFeeKobo(1_000, 7_000, FREE_WEIGHT, SURCHARGE)).toBe(1_400); // 2kg over
  });
});
