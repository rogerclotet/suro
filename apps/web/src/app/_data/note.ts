import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

type ConvexNote = NonNullable<FunctionReturnType<typeof api.notes.get>>;

/**
 * Note shape consumed across the app. Backed by Convex via `adaptNote`, kept
 * field-compatible with the former Drizzle shape. Ids are Convex ids.
 */
export type Note = {
  id: string;
  projectId: string;
  name: string;
  contents: string;
  format: string;
  eventId: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  creatorName: string | null;
  updaterName: string | null;
};

/** Map a Convex note (from `notes.get` / `listByProject`) to the app's `Note`. */
export function adaptNote(n: ConvexNote): Note {
  return {
    id: n._id,
    projectId: n.projectId,
    name: n.name,
    contents: n.contents,
    format: n.format,
    eventId: n.eventId ?? null,
    createdBy: n.createdBy,
    updatedBy: n.updatedBy ?? null,
    createdAt: new Date(n._creationTime),
    updatedAt: n.updatedAt ? new Date(n.updatedAt) : null,
    creatorName: n.creatorName ?? null,
    updaterName: n.updaterName ?? null,
  };
}
