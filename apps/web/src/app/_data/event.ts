import type { Doc } from "backend/convex/_generated/dataModel";
import type { File } from "./file";

/**
 * Calendar event shape consumed across the app. Backed by Convex via
 * `adaptEvent`, kept field-compatible with the former Drizzle shape. `files`
 * (attachments) are deferred to the files/storage migration (Phase 5).
 */
export type Event = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  createdBy: string;
  updatedBy: string | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  files: File[];
};

export type CalendarEvent = Omit<Event, "project">;

/** Map a Convex event doc to the app's `Event` shape. */
export function adaptEvent(e: Doc<"events">): Event {
  return {
    id: e._id,
    projectId: e.projectId,
    name: e.name,
    description: e.description ?? null,
    startAt: new Date(e.startAt),
    endAt: new Date(e.endAt),
    allDay: e.allDay,
    createdBy: e.createdBy,
    updatedBy: e.updatedBy ?? null,
    updatedAt: e.updatedAt ? new Date(e.updatedAt) : null,
    createdAt: new Date(e._creationTime),
    files: [],
  };
}
