import { cn } from "@/lib/utils";
import MonetaryAmount from "./monetary-amount";

export default function UserBalance({
  balance,
  maxAbsBalance,
  currency,
  className,
}: {
  balance: number;
  maxAbsBalance: number;
  currency: string;
  className?: string;
}) {
  function BalanceBar() {
    const positive = balance >= 0;
    const percent = maxAbsBalance === 0 ? 0 : Math.abs(balance) / maxAbsBalance;

    if (positive) {
      return (
        <div
          className="absolute bottom-0 left-[50%] top-0 bg-primary"
          style={{ right: `${50 - percent * 50}%` }}
        />
      );
    }

    return (
      <div
        className="absolute bottom-0 right-[50%] top-0 bg-destructive"
        style={{ left: `${50 - percent * 50}%` }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-10 w-[min(200px,calc(50vw-50px))] items-center justify-center overflow-hidden rounded-md bg-[rgb(from_var(--muted-foreground)_r_g_b/0.1)]",
        className,
      )}
    >
      <BalanceBar />
      <span className="z-10 rounded-full bg-[rgb(from_var(--foreground)_r_g_b/0.8)] px-1">
        <MonetaryAmount
          amount={balance}
          currency={currency}
          className="font-semibold text-primary-foreground"
        />
      </span>
    </div>
  );
}
