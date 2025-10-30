import type { Project } from "@/app/_data/project";
import type { Spending } from "@/app/_data/spending";

type UserId = Project["users"][number]["user"]["id"];

export function calculateBalances(project: Project, spendings: Spending[]) {
  const balancesFromSpendings: Record<UserId, number> = project.users.reduce(
    (acc, user) => {
      acc[user.user.id] = 0;
      return acc;
    },
    {} as Record<UserId, number>,
  );

  for (const spending of spendings) {
    if (spending.from) {
      if (spending.to) {
        addBalanceForDirectSpending(
          balancesFromSpendings,
          spending.amount,
          spending.from.id,
          spending.to.id,
        );
      } else {
        addBalanceForSharedSpending(
          balancesFromSpendings,
          spending.amount,
          spending.from.id,
          project.users,
        );
      }
    }
  }

  return balancesFromSpendings;
}

function addBalanceForDirectSpending(
  balancesFromSpendings: Record<UserId, number>,
  amount: number,
  from: UserId,
  to: UserId,
) {
  balancesFromSpendings[from] = (balancesFromSpendings[from] ?? 0) + amount;
  balancesFromSpendings[to] = (balancesFromSpendings[to] ?? 0) - amount;
}

function addBalanceForSharedSpending(
  balancesFromSpendings: Record<UserId, number>,
  amount: number,
  from: UserId,
  users: Project["users"],
) {
  const amountPerUser = amount / users.length;

  balancesFromSpendings[from] =
    (balancesFromSpendings[from] ?? 0) + (amount - amountPerUser);

  for (const i in balancesFromSpendings) {
    if (i !== from) {
      balancesFromSpendings[i] =
        (balancesFromSpendings[i] ?? 0) - amountPerUser;
    }
  }
}
