"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { adaptNote, type Note } from "@/app/_data/note";

/** Reactive project notes, most recently updated first (Convex). */
export function useProjectNotes(projectId: string): Note[] | undefined {
  const data = useQuery(api.notes.listByProject, {
    projectId: projectId as Id<"projects">,
  });
  return data?.map(adaptNote);
}

/** A single reactive note. `null` if it's gone. */
export function useNote(noteId: string): Note | null | undefined {
  const data = useQuery(api.notes.get, { noteId: noteId as Id<"notes"> });
  if (data === undefined) {
    return undefined;
  }
  return data === null ? null : adaptNote(data);
}
