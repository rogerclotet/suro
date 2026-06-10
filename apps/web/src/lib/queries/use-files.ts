"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { adaptFile, type File } from "@/app/_data/file";

/** Reactive project files, newest first (Convex). */
export function useProjectFiles(projectId: string): File[] | undefined {
  const data = useQuery(api.files.listByProject, {
    projectId: projectId as Id<"projects">,
  });
  return data?.map(adaptFile);
}

/** Reactive files attached to a single event, newest first (Convex). */
export function useEventFiles(eventId: string): File[] | undefined {
  const data = useQuery(api.files.listByEvent, {
    eventId: eventId as Id<"events">,
  });
  return data?.map(adaptFile);
}
