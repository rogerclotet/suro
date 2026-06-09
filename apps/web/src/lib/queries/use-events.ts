"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { adaptEvent, type CalendarEvent } from "@/app/_data/event";
import { adaptList, type List } from "@/app/_data/list";

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

/** Minimal linked-note shape for the event detail (notes domain not yet migrated). */
export type LinkedNote = { id: string; name: string; projectId: string };
/** Minimal linked-pot shape (expenses domain not yet migrated). */
export type LinkedPot = { id: string; name: string; memberCount: number };

export type EventWithLinks = {
  event: CalendarEvent;
  list: List | null;
  note: LinkedNote | null;
  pot: LinkedPot | null;
};

/** A single event with its linked list / note / pot (Convex `events.get`). */
export function useEvent(eventId: string): EventWithLinks | undefined {
  const data = useQuery(api.events.get, { eventId: eventId as Id<"events"> });
  if (data === undefined) {
    return undefined;
  }
  return {
    event: adaptEvent(data),
    list: data.list ? adaptList(data.list) : null,
    note: data.note
      ? {
          id: data.note._id,
          name: data.note.name,
          projectId: data.note.projectId,
        }
      : null,
    pot: data.pot
      ? {
          id: data.pot._id,
          name: data.pot.name,
          memberCount: data.pot.memberCount,
        }
      : null,
  };
}
