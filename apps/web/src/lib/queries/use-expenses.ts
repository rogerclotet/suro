"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  adaptPot,
  adaptPotDetail,
  type Pot,
  type PotDetail,
} from "@/app/_data/pot";

/** Reactive project pots (active first, then settled). */
export function useProjectPots(projectId: string): Pot[] | undefined {
  const data = useQuery(api.expenses.listPots, {
    projectId: projectId as Id<"projects">,
  });
  return data?.map(adaptPot);
}

/** A single pot with members + spendings. `null` if it's gone. */
export function usePot(potId: string): PotDetail | null | undefined {
  const data = useQuery(api.expenses.getPot, { potId: potId as Id<"pots"> });
  if (data === undefined) {
    return undefined;
  }
  return data === null ? null : adaptPotDetail(data);
}
