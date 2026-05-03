export default function MonetaryAmount({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  let currencySymbol = currency.toUpperCase();
  if (currencySymbol === "EUR") {
    currencySymbol = "€";
  }

  return (
    <span className={className}>
      {(amount / 100).toFixed(2)}
      {currencySymbol}
    </span>
  );
}
