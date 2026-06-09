"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { adaptEvent, type CalendarEvent } from "@/app/_data/event";

/** Reactive events overlapping [from, to] for a project (Convex). */
export function useEventsInRange(
  projectId: string | undefined,
  from: Date,
  to: Date,
): CalendarEvent[] | undefined {
  const data = useQuery(
    api.events.listByRange,
    projectId
      ? {
          projectId: projectId as Id<"projects">,
          from: from.getTime(),
          to: to.getTime(),
        }
      : "skip",
  );
  return data?.map(adaptEvent);
}
