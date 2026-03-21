import { describe, expect, it } from "vitest";
import type { Spending } from "@/app/_data/spending";
import { calculateBalances } from "./calculate-balances";

type Member = { user: { id: string } };

describe("calculateBalances", () => {
  const members: Member[] = [
    { user: { id: "user1" } },
    { user: { id: "user2" } },
  ];

  it("should calculate balances for a single spending", () => {
    const spendings = [createSpending(1234, "EUR", "user1", "user2")];

    const balances = calculateBalances(members, spendings);

    expect(balances).toEqual({
      user1: 1234,
      user2: -1234,
    });
  });

  it("should calculate balances for a spending after a settlement", () => {
    const spendings = [
      createSpending(1234, "EUR", "user1", "user2"),
      createSpending(1234, "EUR", "user2", "user1"),
      createSpending(100, "EUR", "user1", "user2"),
    ];

    const balances = calculateBalances(members, spendings);

    expect(balances).toEqual({
      user1: 100,
      user2: -100,
    });
  });

  it("should calculate balances for a single shared spending", () => {
    const spendings = [createSpending(1234, "EUR", "user1", null)];

    const balances = calculateBalances(members, spendings);

    expect(balances).toEqual({
      user1: 617,
      user2: -617,
    });
  });

  it("should calculate balances for a shared spending after a settlement", () => {
    const spendings = [
      createSpending(1234, "EUR", "user1", null),
      createSpending(617, "EUR", "user2", "user1"),
      createSpending(100, "EUR", "user1", null),
    ];

    const balances = calculateBalances(members, spendings);

    expect(balances).toEqual({
      user1: 50,
      user2: -50,
    });
  });

  it("should calculate balances for shared and non-shared spendings with 3 users", () => {
    const threeMembers: Member[] = [
      { user: { id: "user1" } },
      { user: { id: "user2" } },
      { user: { id: "user3" } },
    ];

    const spendings = [
      createSpending(1234, "EUR", "user1", null),
      createSpending(500, "EUR", "user2", "user1"),
      createSpending(100, "EUR", "user3", null),
      createSpending(200, "EUR", "user2", null),
    ];

    const balances = calculateBalances(threeMembers, spendings);

    // 1234 / 3 = 411 base, 1 remainder → user1 pays 412, others pay 411 each
    // user1: +(1234 - 412) = +822, user2: -411, user3: -411
    // 500 direct user2→user1: user2: +500, user1: -500
    // 100 / 3 = 33 base, 1 remainder → user3 pays 34, others pay 33 each
    // user3: +(100 - 34) = +66, user1: -33, user2: -33
    // 200 / 3 = 66 base, 2 remainder → user2 pays 68, user1 pays 67, user3 pays 67
    // user2: +(200 - 68) = +132, user1: -67, user3: -67 (wait, let me recalculate)
    // Actually remainder distribution: payer first, then others in order
    // 200 / 3: base=66, remainder=2. sorted: [user2(payer), user1, user3]
    // user2 share=67, user1 share=67, user3 share=66
    // user2: +(200-67) = +133, user1: -67, user3: -66

    // Totals:
    // user1: 822 - 500 - 33 - 67 = 222
    // user2: -411 + 500 - 33 + 133 = 189
    // user3: -411 + 66 - 66 = -411
    // Sum: 222 + 189 + (-411) = 0 ✓

    expect(balances.user1).toEqual(222);
    expect(balances.user2).toEqual(189);
    expect(balances.user3).toEqual(-411);
  });

  it("should handle odd splits with no rounding errors", () => {
    const threeMembers: Member[] = [
      { user: { id: "user1" } },
      { user: { id: "user2" } },
      { user: { id: "user3" } },
    ];

    // 10 cents split 3 ways: base=3, remainder=1
    // user1(payer) share=4, user2 share=3, user3 share=3
    const spendings = [createSpending(10, "EUR", "user1", null)];

    const balances = calculateBalances(threeMembers, spendings);

    expect(balances).toEqual({
      user1: 6, // 10 - 4
      user2: -3,
      user3: -3,
    });

    // Sum must be exactly 0
    const sum = Object.values(balances).reduce((a, b) => a + b, 0);
    expect(sum).toEqual(0);
  });
});

function createSpending(
  amount: number,
  currency: string,
  from: string,
  to: string | null,
) {
  return {
    id: "spending",
    amount,
    currency,
    from: {
      id: from,
    } as Spending["from"],
    to:
      to === null
        ? null
        : ({
            id: to,
          } as Spending["to"]),
  } as Spending;
}
