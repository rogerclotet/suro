/**
 * Shared expense math, ported from the PWA's calculate-balances and
 * generate-proposals. All amounts are integer cents.
 */

export type SpendingInput<UserId extends string = string> = {
  amount: number;
  from?: UserId | null;
  to?: UserId | null;
};

export type SettlingPayment<UserId extends string = string> = {
  from: UserId;
  to: UserId;
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
export function calculateBalances<UserId extends string>(
  memberIds: UserId[],
  spendings: SpendingInput<UserId>[],
): Map<UserId, number> {
  const balances = new Map<UserId, number>();
  for (const id of memberIds) {
    balances.set(id, 0);
  }
  const add = (id: UserId, delta: number) => {
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
 * Sum of split spendings (`to` unset) — direct transfers (`to` set, used for
 * both explicit single-recipient spendings and settle-up payments) move
 * money between members rather than spending new money, so they're excluded.
 */
export function totalSpent(spendings: SpendingInput[]): number {
  return spendings.reduce((sum, s) => (s.to ? sum : sum + s.amount), 0);
}

/**
 * Greedy settle-up: repeatedly pay the largest debtor's debt to the largest
 * creditor until everyone is square. Not minimal, but matches the PWA.
 */
export function generateProposals<UserId extends string>(
  balances: Map<UserId, number>,
): SettlingPayment<UserId>[] {
  const entries = [...balances.entries()].map(([id, amount]) => ({
    id,
    amount,
  }));
  const payments: SettlingPayment<UserId>[] = [];

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

/** Directed payment identity. The amount stays in the reviewed draft. */
export function settlementPaymentKey(payment: SettlingPayment): string {
  return JSON.stringify([payment.from, payment.to]);
}

export type SettlementDraft<Payment extends SettlingPayment> = {
  reviewed: Payment[];
  selectedKeys: ReadonlySet<string>;
};

export function createSettlementDraft<Payment extends SettlingPayment>(
  proposals: readonly Payment[],
): SettlementDraft<Payment> {
  return {
    reviewed: proposals.map((payment) => ({ ...payment })),
    selectedKeys: new Set(proposals.map(settlementPaymentKey)),
  };
}

export function toggleSettlementPayment<Payment extends SettlingPayment>(
  draft: SettlementDraft<Payment>,
  payment: Payment,
): SettlementDraft<Payment> {
  const selectedKeys = new Set(draft.selectedKeys);
  const key = settlementPaymentKey(payment);
  if (selectedKeys.has(key)) selectedKeys.delete(key);
  else selectedKeys.add(key);
  return { ...draft, selectedKeys };
}

export function selectedSettlementPayments<Payment extends SettlingPayment>(
  draft: SettlementDraft<Payment>,
): Payment[] {
  return draft.reviewed.filter((payment) =>
    draft.selectedKeys.has(settlementPaymentKey(payment)),
  );
}

/** Reordering does not invalidate review; amounts and participants do. */
export function settlementProposalsMatch(
  reviewed: readonly SettlingPayment[],
  current: readonly SettlingPayment[],
): boolean {
  const keys = (payments: readonly SettlingPayment[]) =>
    payments.map((p) => JSON.stringify([p.from, p.to, p.amount])).sort();
  return JSON.stringify(keys(reviewed)) === JSON.stringify(keys(current));
}
