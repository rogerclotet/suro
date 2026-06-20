import type { Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { calculateBalances, generateProposals } from "./balances";

const u = (s: string) => s as Id<"users">;

describe("calculateBalances", () => {
  it("splits a payment equally among members", () => {
    const b = calculateBalances(
      [u("a"), u("b")],
      [{ amount: 100, from: u("a") }],
    );
    expect(b.get(u("a"))).toBe(50);
    expect(b.get(u("b"))).toBe(-50);
  });

  it("moves the full amount for a direct payment", () => {
    const b = calculateBalances(
      [u("a"), u("b")],
      [{ amount: 30, from: u("a"), to: u("b") }],
    );
    expect(b.get(u("a"))).toBe(30);
    expect(b.get(u("b"))).toBe(-30);
  });

  it("gives rounding cents to the payer first, summing to zero", () => {
    const b = calculateBalances(
      [u("a"), u("b"), u("c")],
      [{ amount: 100, from: u("a") }],
    );
    expect(b.get(u("a"))).toBe(66);
    expect(b.get(u("b"))).toBe(-33);
    expect(b.get(u("c"))).toBe(-33);
    expect(
      (b.get(u("a")) ?? 0) + (b.get(u("b")) ?? 0) + (b.get(u("c")) ?? 0),
    ).toBe(0);
  });
});

describe("generateProposals", () => {
  it("proposes the debtor pay the creditor", () => {
    const b = calculateBalances(
      [u("a"), u("b")],
      [{ amount: 100, from: u("a") }],
    );
    expect(generateProposals(b)).toEqual([
      { from: u("b"), to: u("a"), amount: 50 },
    ]);
  });

  it("returns nothing when everyone is square", () => {
    const b = calculateBalances([u("a"), u("b")], []);
    expect(generateProposals(b)).toEqual([]);
  });
});
