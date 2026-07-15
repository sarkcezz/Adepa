import { describe, it, expect } from "vitest";
import { discountKobo } from "./orders";
import { calculateDeliveryFeeKobo, DEFAULT_ZONE_FEE_KOBO } from "./shipping";

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

describe("calculateDeliveryFeeKobo", () => {
  it("charges the zone's base fee under the free-weight allowance", () => {
    expect(calculateDeliveryFeeKobo("Ejisu", 2_000)).toBe(1_000);
    expect(calculateDeliveryFeeKobo("Suame", 5_000)).toBe(1_700);
  });

  it("is case-insensitive on the district name", () => {
    expect(calculateDeliveryFeeKobo("SUAME", 0)).toBe(1_700);
  });

  it("falls back to the default fee for an unknown or missing district", () => {
    expect(calculateDeliveryFeeKobo("Somewhere Else", 0)).toBe(DEFAULT_ZONE_FEE_KOBO);
    expect(calculateDeliveryFeeKobo(undefined, 0)).toBe(DEFAULT_ZONE_FEE_KOBO);
  });

  it("adds a per-kg surcharge past the free weight allowance, rounding up", () => {
    expect(calculateDeliveryFeeKobo("Ejisu", 5_000)).toBe(1_000); // exactly at the allowance
    expect(calculateDeliveryFeeKobo("Ejisu", 5_500)).toBe(1_200); // 0.5kg over -> 1 extra kg
    expect(calculateDeliveryFeeKobo("Ejisu", 7_000)).toBe(1_400); // 2kg over
  });
});
