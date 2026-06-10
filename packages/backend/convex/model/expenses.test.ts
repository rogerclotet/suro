import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import {
  calculateBalances,
  generateProposals,
  type SpendingInput,
} from "./expenses";

const u1 = "u1" as Id<"users">;
const u2 = "u2" as Id<"users">;
const u3 = "u3" as Id<"users">;

function balances(memberIds: Id<"users">[], spendings: SpendingInput[]) {
  return Object.fromEntries(calculateBalances(memberIds, spendings).entries());
}

describe("calculateBalances", () => {
  it("is all zero with no spendings", () => {
    expect(balances([u1, u2, u3], [])).toEqual({ u1: 0, u2: 0, u3: 0 });
  });

  it("records a direct payment as a transfer", () => {
    expect(balances([u1, u2], [{ amount: 100, from: u1, to: u2 }])).toEqual({
      u1: 100,
      u2: -100,
    });
  });

  it("splits an even amount equally among all members", () => {
    expect(balances([u1, u2, u3], [{ amount: 300, from: u1 }])).toEqual({
      u1: 200,
      u2: -100,
      u3: -100,
    });
  });

  it("gives rounding cents to the payer first (1234 / 3)", () => {
    // base 411, remainder 1 → payer absorbs the extra cent; sums to zero.
    expect(balances([u1, u2, u3], [{ amount: 1234, from: u1 }])).toEqual({
      u1: 822,
      u2: -411,
      u3: -411,
    });
  });

  it("always sums to zero across mixed spendings", () => {
    const result = calculateBalances(
      [u1, u2, u3],
      [
        { amount: 1234, from: u1 },
        { amount: 500, from: u2, to: u3 },
        { amount: 99, from: u3 },
      ],
    );
    const total = [...result.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });
});

describe("generateProposals", () => {
  it("returns nothing when everyone is settled", () => {
    const map = calculateBalances([u1, u2, u3], []);
    expect(generateProposals(map)).toEqual([]);
  });

  it("clears every balance with the proposed payments", () => {
    const map = calculateBalances([u1, u2, u3], [{ amount: 1234, from: u1 }]);
    const proposals = generateProposals(map);

    // Debtors pay the creditor; total moved equals what the creditor is owed.
    const moved = proposals.reduce((sum, p) => sum + p.amount, 0);
    expect(moved).toBe(822);

    // Applying the proposals zeroes out all balances.
    const settled = new Map(map);
    for (const p of proposals) {
      settled.set(p.from, (settled.get(p.from) ?? 0) + p.amount);
      settled.set(p.to, (settled.get(p.to) ?? 0) - p.amount);
    }
    for (const amount of settled.values()) {
      expect(amount).toBe(0);
    }
  });
});
