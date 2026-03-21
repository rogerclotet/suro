import type { Spending } from "@/app/_data/spending";
import { calculateBalances } from "./calculate-balances";
import type { SettlingPayment } from "./data";

type Member = { user: { id: string } };

export function generateProposals(members: Member[], spendings: Spending[]) {
  if (spendings.length === 0) {
    return [];
  }

  const currency = spendings[0]?.currency ?? "EUR";

  const balances = Object.entries(calculateBalances(members, spendings)).map(
    ([userId, balance]) => ({
      userId,
      balance,
    }),
  );

  const toPay = new Map<string, Map<string, number>>();

  do {
    balances.sort((a, b) => b.balance - a.balance);

    outer: for (let i = 0; i < balances.length; i++) {
      const balanceI = balances[i];
      if (!balanceI) continue;

      const userId = balanceI.userId;
      const balance = balanceI.balance;

      for (let j = 0; j < balances.length; j++) {
        if (i === j) {
          continue;
        }

        const balanceJ = balances[j];
        if (!balanceJ) continue;

        const amount = Math.min(balance, -balanceJ.balance);
        if (amount <= 0) {
          continue;
        }

        const fromUserId = balanceJ.userId;

        if (!toPay.has(fromUserId)) {
          toPay.set(fromUserId, new Map());
        }
        const currentToPay = toPay.get(fromUserId)?.get(userId) ?? 0;
        toPay.get(balanceJ.userId)?.set(userId, currentToPay + amount);

        balanceI.balance -= amount;
        balanceJ.balance += amount;

        break outer;
      }
    }
  } while (balances.some(({ balance }) => balance > 0));

  toPay.forEach((toPays, _fromUserId) => {
    toPays.forEach((amount, toUserId) => {
      if (amount === 0) {
        toPays.delete(toUserId);
      }
    });
  });

  const proposals: SettlingPayment[] = Array.from(toPay).flatMap(
    ([fromUserId, toPays]) => {
      return Array.from(toPays).map(([toUserId, amount]) => ({
        amount,
        currency,
        to: toUserId,
        from: fromUserId,
      }));
    },
  );

  return proposals;
}
