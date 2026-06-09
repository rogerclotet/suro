import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

type ConvexSpending = NonNullable<
  FunctionReturnType<typeof api.expenses.getPot>
>["spendings"][number];

/**
 * Spending shape consumed by the expenses UI + balance calc. Backed by Convex
 * via `adaptSpending`; `from`/`to` carry the member id + display name.
 */
export type Spending = {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  from: { id: string; name: string | null } | null;
  to: { id: string; name: string | null } | null;
  projectId: string;
  potId: string | null;
  createdAt: Date | null;
};

export function adaptSpending(s: ConvexSpending): Spending {
  return {
    id: s._id,
    amount: s.amount,
    currency: s.currency,
    description: s.description ?? null,
    from: s.from ? { id: s.from, name: s.fromName } : null,
    to: s.to ? { id: s.to, name: s.toName } : null,
    projectId: s.projectId,
    potId: s.potId ?? null,
    createdAt: new Date(s.createdAt ?? s._creationTime),
  };
}
