import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { adaptSpending, type Spending } from "./spending";

type ConvexPotListItem = FunctionReturnType<
  typeof api.expenses.listPots
>[number];
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
};

export type PotDetail = Pot & { spendings: Spending[] };

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
): Omit<Pot, "users"> {
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
  return { ...adaptPotFields(p), users: p.members.map(adaptMember) };
}

export function adaptPotDetail(p: ConvexPotDetail): PotDetail {
  return {
    ...adaptPotFields(p),
    users: p.members.map(adaptMember),
    spendings: p.spendings.map(adaptSpending),
  };
}
