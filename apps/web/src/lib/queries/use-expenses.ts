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

export type PotsOverview = {
  active: Pot[];
  settled: Pot[];
  hasMoreSettled: boolean;
};

/**
 * Reactive project pots split into active and a page of the most recently
 * settled ones. `settledLimit` trims settled pots that pile up after a trip;
 * "show more" re-runs with a larger limit. `hasMoreSettled` gates the button.
 */
export function useProjectPotsOverview(
  projectId: string,
  settledLimit: number,
): PotsOverview | undefined {
  const data = useQuery(api.expenses.listPotsOverview, {
    projectId: projectId as Id<"projects">,
    settledLimit,
  });
  if (data === undefined) {
    return undefined;
  }
  return {
    active: data.active.map(adaptPot),
    settled: data.settled.map(adaptPot),
    hasMoreSettled: data.hasMoreSettled,
  };
}

/** Solo-group expense tracker with monthly totals. */
export function useSoloExpenses(projectId: string) {
  return useQuery(api.expenses.getSoloExpenses, {
    projectId: projectId as Id<"projects">,
  });
}

/** A single pot with members + spendings. `null` if it's gone. */
export function usePot(potId: string): PotDetail | null | undefined {
  const data = useQuery(api.expenses.getPot, { potId: potId as Id<"pots"> });
  if (data === undefined) {
    return undefined;
  }
  return data === null ? null : adaptPotDetail(data);
}
