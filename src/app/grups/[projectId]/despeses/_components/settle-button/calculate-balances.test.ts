import type { Project } from "@/app/_data/project";
import type { Spending } from "@/app/_data/spending";
import { describe, expect, it } from "vitest";
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
});

function createSpending(
  amount: number,
  currency: string,
  from: string,
  to: string,
) {
  return {
    id: "spending",
    amount,
    currency,
    from: {
      id: from,
    } as Spending["from"],
    to: {
      id: to,
    } as Spending["to"],
  } as Spending;
}
