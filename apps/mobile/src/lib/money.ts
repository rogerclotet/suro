const CENTS = 100;

/** Format integer cents (the storage unit) with the currency symbol. */
export function formatMoney(cents: number, currency = "EUR"): string {
  const amount = (cents / CENTS).toFixed(2);
  return currency === "EUR" ? `${amount} €` : `${amount} ${currency}`;
}

/** Parse a user-typed amount (major units) into integer cents, or null. */
export function parseMoney(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (normalized === "") {
    return null;
  }
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value * CENTS);
}
