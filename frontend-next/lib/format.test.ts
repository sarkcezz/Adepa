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
  it("formats whole-pound pack sizes cleanly", () => {
    expect(formatWeight(454)).toBe("1lb"); // 1lb pack, rounds off the 453.592 remainder
    expect(formatWeight(907)).toBe("2lb");
    expect(formatWeight(2268)).toBe("5lb");
    expect(formatWeight(4536)).toBe("10lb");
  });

  it("shows one decimal for a non-whole pound amount", () => {
    expect(formatWeight(600)).toBe("1.3lb");
  });

  it("handles missing weight", () => {
    expect(formatWeight(null)).toBe("");
    expect(formatWeight(undefined)).toBe("");
  });
});
