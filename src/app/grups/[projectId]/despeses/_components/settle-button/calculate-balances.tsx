import type { Project } from "@/app/_data/project";
import type { Spending } from "@/app/_data/spending";

export function calculateBalances(project: Project, spendings: Spending[]) {
  const balancesFromSpendings: Record<string, number> = {};

  for (const spending of spendings) {
    if (spending.from) {
      balancesFromSpendings[spending.from.id] =
        (balancesFromSpendings[spending.from.id] ?? 0) + spending.amount;

      if (spending.to) {
        balancesFromSpendings[spending.to.id] =
          (balancesFromSpendings[spending.to.id] ?? 0) - spending.amount;
      } else {
        const amount = spending.amount / (project.users.length - 1);
        for (const i in balancesFromSpendings) {
          if (i !== spending.from.id) {
            balancesFromSpendings[i] = (balancesFromSpendings[i] ?? 0) - amount;
          }
        }
      }
    }
  }

  return balancesFromSpendings;
}
