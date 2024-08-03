import type { Spending } from "@/app/_data/spending";
import SpendingLine from "./spending-line";

export default function SpendingsList({
  spendings,
}: {
  spendings: Spending[];
}) {
  if (spendings.length === 0) {
    return (
      <p className="italic text-muted-foreground">No hi ha transaccions</p>
    );
  }

  return (
    <ul className="list-disc space-y-2 pl-6">
      {spendings.map((spending) => (
        <li key={spending.id}>
          <SpendingLine spending={spending} />
        </li>
      ))}
    </ul>
  );
}
