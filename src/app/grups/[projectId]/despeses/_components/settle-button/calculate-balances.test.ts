import { describe, expect, it } from "vitest";
import type { Project } from "@/app/_data/project";
import type { Spending } from "@/app/_data/spending";
import { calculateBalances } from "./calculate-balances";

describe("calculateBalances", () => {
  const project = {
    id: "project-id",
    users: [{ user: { id: "user1" } }, { user: { id: "user2" } }],
  } as Project;

  it("should calculate balances for a single spending", () => {
    const spendings = [createSpending(1234, "EUR", "user1", "user2")];

    const balances = calculateBalances(project, spendings);

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

    const balances = calculateBalances(project, spendings);

    expect(balances).toEqual({
      user1: 100,
      user2: -100,
    });
  });

  it("should calculate balances for a single shared spending", () => {
    const spendings = [createSpending(1234, "EUR", "user1", null)];

    const balances = calculateBalances(project, spendings);

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

    const balances = calculateBalances(project, spendings);

    expect(balances).toEqual({
      user1: 50,
      user2: -50,
    });
  });

  it("should calculate balances for shared and non-shared spendings", () => {
    const project = {
      id: "project-id",
      users: [
        { user: { id: "user1" } },
        { user: { id: "user2" } },
        { user: { id: "user3" } },
      ],
    } as Project;

    const spendings = [
      createSpending(1234, "EUR", "user1", null),
      createSpending(500, "EUR", "user2", "user1"),
      createSpending(100, "EUR", "user3", null),
      createSpending(200, "EUR", "user2", null),
    ];

    const balances = calculateBalances(project, spendings);

    expect(balances.user1).toBeCloseTo(222.666, 2);
    expect(balances.user2).toBeCloseTo(188.666, 2);
    expect(balances.user3).toBeCloseTo(-411.333, 2);
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
