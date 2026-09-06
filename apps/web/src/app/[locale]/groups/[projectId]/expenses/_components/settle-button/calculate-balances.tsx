import { calculateBalances as calculate } from "domain/expenses";
import type { Spending } from "@/app/_data/spending";

export function calculateBalances(
  members: { user: { id: string } }[],
  spendings: Spending[],
) {
  return Object.fromEntries(
    calculate(
      members.map(({ user }) => user.id),
      spendings.map((s) => ({
        amount: s.amount,
        from: s.from?.id,
        to: s.to?.id,
      })),
    ),
  );
}
