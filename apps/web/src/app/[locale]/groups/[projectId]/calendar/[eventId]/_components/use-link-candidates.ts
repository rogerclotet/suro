"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo } from "react";

/**
 * Whether the event still has unlinkable lists, notes, or pots in the project.
 * Skips queries for kinds the event already has linked.
 */
export function useHasLinkCandidates(
  projectId: string | undefined,
  linked: { list: boolean; note: boolean; pot: boolean },
): boolean {
  const lists = useQuery(
    api.lists.listByProject,
    projectId && !linked.list
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
  const notes = useQuery(
    api.notes.listByProject,
    projectId && !linked.note
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
  const pots = useQuery(
    api.expenses.listPots,
    projectId && !linked.pot
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );

  return useMemo(() => {
    if (!linked.list && lists?.some((item) => !item.eventId)) {
      return true;
    }
    if (!linked.note && notes?.some((item) => !item.eventId)) {
      return true;
    }
    if (!linked.pot && pots?.some((item) => !item.eventId)) {
      return true;
    }
    return false;
  }, [lists, notes, pots, linked.list, linked.note, linked.pot]);
}
