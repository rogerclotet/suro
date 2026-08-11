import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { adaptSpending, type Spending } from "./spending";

type ConvexPotListItem = FunctionReturnType<
  typeof api.expenses.listPotsOverview
>["active"][number];
type ConvexPotDetail = NonNullable<
  FunctionReturnType<typeof api.expenses.getPot>
>;

export type PotMember = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    avatarColor: string | null;
  };
};

/** A pot (expense group). Backed by Convex via `adaptPot`; ids are Convex ids. */
export type Pot = {
  id: string;
  name: string;
  projectId: string;
  eventId: string | null;
  settledAt: Date | null;
  createdAt: Date | null;
  createdBy: string;
  users: PotMember[];
  totalSpent: number;
};

export type PotDetail = Pot & { spendings: Spending[] };

/**
 * Sum of split spendings (`to` unset) — direct transfers (`to` set, used for
 * both explicit single-recipient spendings and settle-up payments) move
 * money between members rather than spending new money, so they're excluded.
 * Ported from the backend's `packages/backend/convex/model/expenses.ts`.
 */
function sumSpendings(spendings: Spending[]): number {
  return spendings.reduce((sum, s) => (s.to ? sum : sum + s.amount), 0);
}

function adaptMember(m: {
  _id: string | null;
  name: string | null;
  image: string | null;
  avatarColor: string | null;
}): PotMember {
  return {
    user: {
      id: m._id ?? "",
      name: m.name,
      image: m.image,
      avatarColor: m.avatarColor,
    },
  };
}

function adaptPotFields(
  p: ConvexPotListItem | ConvexPotDetail,
): Omit<Pot, "users" | "totalSpent"> {
  return {
    id: p._id,
    name: p.name,
    projectId: p.projectId,
    eventId: p.eventId ?? null,
    settledAt: p.settledAt ? new Date(p.settledAt) : null,
    createdAt: new Date(p.createdAt ?? p._creationTime),
    createdBy: p.createdBy,
  };
}

export function adaptPot(p: ConvexPotListItem): Pot {
  return {
    ...adaptPotFields(p),
    users: p.members.map(adaptMember),
    totalSpent: p.totalSpent,
  };
}

export function adaptPotDetail(p: ConvexPotDetail): PotDetail {
  const spendings = p.spendings.map(adaptSpending);
  return {
    ...adaptPotFields(p),
    users: p.members.map(adaptMember),
    spendings,
    totalSpent: sumSpendings(spendings),
  };
}
