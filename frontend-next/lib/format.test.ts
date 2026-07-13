import { describe, it, expect } from "vitest";
import { formatGhs, formatWeight } from "./format";

describe("formatGhs", () => {
  it("converts pesewas to a GHS currency string", () => {
    expect(formatGhs(17_000)).toContain("170.00");
    expect(formatGhs(0)).toContain("0.00");
  });

  it("treats null/undefined as zero", () => {
    expect(formatGhs(undefined as unknown as number)).toContain("0.00");
  });
});

describe("formatWeight", () => {
  it("formats grams under 1000 as g", () => {
    expect(formatWeight(500)).toBe("500g");
  });

  it("formats 1000+ grams as kg", () => {
    expect(formatWeight(1000)).toBe("1kg");
    expect(formatWeight(1500)).toBe("1.5kg");
  });

  it("handles missing weight", () => {
    expect(formatWeight(null)).toBe("");
    expect(formatWeight(undefined)).toBe("");
  });
});
