import { describe, it, expect } from "vitest";
import { discountKobo, HOME_DELIVERY_FEE_KOBO } from "./orders";

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

describe("HOME_DELIVERY_FEE_KOBO", () => {
  it("is the flat GHS 15 fee", () => {
    expect(HOME_DELIVERY_FEE_KOBO).toBe(1_500);
  });
});
