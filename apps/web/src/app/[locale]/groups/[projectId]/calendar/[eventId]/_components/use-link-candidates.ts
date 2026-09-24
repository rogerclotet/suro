"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { useMemo } from "react";

/**
 * Whether the event still has unlinkable lists, notes, or pots in the project.
 * Skips queries for kinds the event already has linked.
 */
export function useHasLinkCandidates(
  projectId: string | undefined,
  linked: { list: boolean; note: boolean; pot: boolean },
): boolean {
  const { isAuthenticated } = useConvexAuth();
  const lists = useQuery(
    api.events.listLinkCandidates,
    isAuthenticated && projectId && !linked.list
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
  const notes = useQuery(
    api.events.noteLinkCandidates,
    isAuthenticated && projectId && !linked.note
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
  const pots = useQuery(
    api.events.potLinkCandidates,
    isAuthenticated && projectId && !linked.pot
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );

  return useMemo(() => {
    if (!linked.list && lists?.length) {
      return true;
    }
    if (!linked.note && notes?.length) {
      return true;
    }
    if (!linked.pot && pots?.length) {
      return true;
    }
    return false;
  }, [lists, notes, pots, linked.list, linked.note, linked.pot]);
}
