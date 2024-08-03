import type { Project } from "@/app/_data/project";
import type { Spending } from "@/app/_data/spending";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateBalances } from "./calculate-balances";
import { generateProposals } from "./generate-proposals";

const calculateBalancesMock = vi.mocked(calculateBalances);

vi.mock("./calculate-balances", () => ({
  calculateBalances: vi.fn(),
}));

describe("generate proposals", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const project = { id: "project-id" } as Project;

  it("should generate empty proposals for empty spendings", () => {
    const spendings: Spending[] = [];
    const proposals = generateProposals(project, spendings);
    expect(proposals).toEqual([]);
  });

  it("should generate proposals for spendings", () => {
    const spendings: Spending[] = [
      createSpending(100, "EUR", "user1", "user2"),
      createSpending(200, "EUR", "user2", "user1"),
    ];

    calculateBalancesMock.mockReturnValueOnce({
      user1: -100,
      user2: 100,
    });

    const proposals = generateProposals(project, spendings);

    expect(calculateBalancesMock).toHaveBeenNthCalledWith(
      1,
      project,
      spendings,
    );

    expect(proposals).toHaveLength(1);
    expect(proposals[0]!.from).toEqual("user1");
    expect(proposals[0]!.to).toEqual("user2");
    expect(proposals[0]!.amount).toEqual(100);
  });

  it("should generate proposals for spendings from more than two users", () => {
    // Just to have a spending for the currency
    const spendings = [createSpending(100, "EUR", "user1", "user2")];

    calculateBalancesMock.mockReturnValueOnce({
      user1: 5735,
      user2: -1740,
      user3: -3465,
      user4: 2935,
      user5: -3465,
    });

    const proposals = generateProposals(project, spendings);

    expect(calculateBalancesMock).toHaveBeenNthCalledWith(
      1,
      project,
      spendings,
    );

    expect(proposals).toHaveLength(4);

    expect(proposals[0]!.from).toEqual("user2");
    expect(proposals[0]!.to).toEqual("user1");
    expect(proposals[0]!.amount).toEqual(1740);

    expect(proposals[1]!.from).toEqual("user3");
    expect(proposals[1]!.to).toEqual("user1");
    expect(proposals[1]!.amount).toEqual(3465);

    expect(proposals[2]!.from).toEqual("user5");
    expect(proposals[2]!.to).toEqual("user4");
    expect(proposals[2]!.amount).toEqual(2935);

    expect(proposals[3]!.from).toEqual("user5");
    expect(proposals[3]!.to).toEqual("user1");
    expect(proposals[3]!.amount).toEqual(530);
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
