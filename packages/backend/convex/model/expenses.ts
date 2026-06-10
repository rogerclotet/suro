import type { Id } from "../_generated/dataModel";

/**
 * Shared expense math, ported from the PWA's calculate-balances and
 * generate-proposals. All amounts are integer cents.
 */

export type SpendingInput = {
  amount: number;
  from?: Id<"users"> | null;
  to?: Id<"users"> | null;
};

export type SettlingPayment = {
  from: Id<"users">;
  to: Id<"users">;
  amount: number;
};

/**
 * Net balance per member, in cents. Positive = the member is owed money;
 * negative = the member owes. Two spending kinds:
 *  - direct (`to` set): `from` paid `to` that amount.
 *  - split (`to` unset): amount split equally across all members; the rounding
 *    cents go to the earliest in [payer, ...others sorted by id], matching the
 *    PWA so balances sum to exactly zero.
 */
export function calculateBalances(
  memberIds: Id<"users">[],
  spendings: SpendingInput[],
): Map<Id<"users">, number> {
  const balances = new Map<Id<"users">, number>();
  for (const id of memberIds) {
    balances.set(id, 0);
  }
  const add = (id: Id<"users">, delta: number) => {
    balances.set(id, (balances.get(id) ?? 0) + delta);
  };

  for (const spending of spendings) {
    if (spending.to) {
      if (spending.from) {
        add(spending.from, spending.amount);
      }
      add(spending.to, -spending.amount);
    } else if (spending.from) {
      const n = memberIds.length;
      if (n === 0) {
        continue;
      }
      const payer = spending.from;
      const base = Math.floor(spending.amount / n);
      const remainder = spending.amount - base * n;
      const others = memberIds.filter((id) => id !== payer).sort();
      const ordered = [payer, ...others];
      ordered.forEach((id, index) => {
        const share = base + (index < remainder ? 1 : 0);
        if (id === payer) {
          add(id, spending.amount - share);
        } else {
          add(id, -share);
        }
      });
    }
  }
  return balances;
}

/**
 * Greedy settle-up: repeatedly pay the largest debtor's debt to the largest
 * creditor until everyone is square. Not minimal, but matches the PWA.
 */
export function generateProposals(
  balances: Map<Id<"users">, number>,
): SettlingPayment[] {
  const entries = [...balances.entries()].map(([id, amount]) => ({
    id,
    amount,
  }));
  const payments: SettlingPayment[] = [];

  while (true) {
    let creditor = entries[0];
    let debtor = entries[0];
    for (const entry of entries) {
      if (creditor === undefined || entry.amount > creditor.amount) {
        creditor = entry;
      }
      if (debtor === undefined || entry.amount < debtor.amount) {
        debtor = entry;
      }
    }
    if (
      creditor === undefined ||
      debtor === undefined ||
      creditor.amount <= 0 ||
      debtor.amount >= 0
    ) {
      break;
    }
    const amount = Math.min(creditor.amount, -debtor.amount);
    if (amount <= 0) {
      break;
    }
    payments.push({ from: debtor.id, to: creditor.id, amount });
    creditor.amount -= amount;
    debtor.amount += amount;
  }
  return payments;
}
