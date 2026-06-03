import type { Spending } from "@/app/_data/spending";

type Member = { user: { id: string } };
type UserId = string;

export function calculateBalances(members: Member[], spendings: Spending[]) {
  const balancesFromSpendings: Record<UserId, number> = {};
  for (const member of members) {
    balancesFromSpendings[member.user.id] = 0;
  }

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
          members,
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
  members: Member[],
) {
  const memberCount = members.length;
  const base = Math.floor(amount / memberCount);
  const remainder = amount - base * memberCount;

  // Payer gets priority for the extra cents from rounding,
  // then other members in order.
  const sortedIds = members
    .map((m) => m.user.id)
    .sort((a, b) => {
      if (a === from) return -1;
      if (b === from) return 1;
      return 0;
    });

  for (const [i, memberId] of sortedIds.entries()) {
    const share = base + (i < remainder ? 1 : 0);
    if (memberId === from) {
      balancesFromSpendings[from] =
        (balancesFromSpendings[from] ?? 0) + (amount - share);
    } else {
      balancesFromSpendings[memberId] =
        (balancesFromSpendings[memberId] ?? 0) - share;
    }
  }
}
