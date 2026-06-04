import { describe, expect, it } from "vitest";
import { formatMoney, parseMoney } from "./money";

describe("formatMoney", () => {
  it("formats integer cents as euros by default", () => {
    expect(formatMoney(0)).toBe("0.00 €");
    expect(formatMoney(100)).toBe("1.00 €");
    expect(formatMoney(1234)).toBe("12.34 €");
    expect(formatMoney(5)).toBe("0.05 €");
  });

  it("appends the currency code for non-EUR currencies", () => {
    expect(formatMoney(1234, "USD")).toBe("12.34 USD");
    expect(formatMoney(5, "GBP")).toBe("0.05 GBP");
  });

  it("keeps the sign for negative amounts", () => {
    expect(formatMoney(-500)).toBe("-5.00 €");
  });
});

describe("parseMoney", () => {
  it("parses major-unit amounts into integer cents", () => {
    expect(parseMoney("12.34")).toBe(1234);
    expect(parseMoney("10")).toBe(1000);
    expect(parseMoney("0.05")).toBe(5);
  });

  it("accepts a comma as the decimal separator", () => {
    expect(parseMoney("12,34")).toBe(1234);
    expect(parseMoney("1,5")).toBe(150);
  });

  it("trims surrounding whitespace", () => {
    expect(parseMoney("  2.5  ")).toBe(250);
  });

  it("rounds to the nearest cent", () => {
    expect(parseMoney("1.999")).toBe(200);
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("   ")).toBeNull();
  });

  it("returns null for zero and negative amounts", () => {
    expect(parseMoney("0")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
  });

  it("returns null for non-numeric or non-finite input", () => {
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("1e999")).toBeNull();
  });
});
