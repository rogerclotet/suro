type SpendingLike = {
  amount: number;
  createdAt: Date | number | null;
};

function spendingDate(createdAt: Date | number | null): Date | null {
  if (createdAt === null) {
    return null;
  }
  return createdAt instanceof Date ? createdAt : new Date(createdAt);
}

/** Sum spendings whose `createdAt` falls in the calendar month `monthOffset` from now. */
export function monthSpendingTotal(
  spendings: SpendingLike[],
  monthOffset: number,
): number {
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);
  anchor.setMonth(anchor.getMonth() + monthOffset);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  return spendings.reduce((sum, spending) => {
    const createdAt = spendingDate(spending.createdAt);
    if (createdAt === null) {
      return sum;
    }
    if (createdAt.getFullYear() === year && createdAt.getMonth() === month) {
      return sum + spending.amount;
    }
    return sum;
  }, 0);
}

/** Daily spending totals (cents) for each day of a calendar month, 1-indexed order. */
export function monthDailyAmounts(
  spendings: SpendingLike[],
  monthOffset: number,
): number[] {
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);
  anchor.setMonth(anchor.getMonth() + monthOffset);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const throughDay =
    monthOffset === 0
      ? Math.min(new Date().getDate(), daysInMonth)
      : daysInMonth;

  const amounts = Array.from({ length: throughDay }, () => 0);
  for (const spending of spendings) {
    const createdAt = spendingDate(spending.createdAt);
    if (createdAt === null) {
      continue;
    }
    if (
      createdAt.getFullYear() === year &&
      createdAt.getMonth() === month &&
      createdAt.getDate() <= throughDay
    ) {
      const dayIndex = createdAt.getDate() - 1;
      amounts[dayIndex] = (amounts[dayIndex] ?? 0) + spending.amount;
    }
  }
  return amounts;
}
