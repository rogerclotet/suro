"use server";

import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import type { Note } from "@/app/_data/note";
import type { Pot } from "@/app/_data/pot";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import {
  requireEvent,
  requireList,
  requireNote,
  requirePot,
  requireSession,
} from "@/server/action-auth";
import { db } from "@/server/db";
import { events, lists, notes, pots, potToUsers } from "@/server/db/schema";
import { eventSchema } from "../_components/event/data";

export async function createLinkedList(event: Event) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);

  try {
    const res = await db
      .insert(lists)
      .values({
        name: serverEvent.name,
        description: `Llista per ${serverEvent.name}`,
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        createdBy: session.user.id,
      })
      .returning({ id: lists.id });

    const listId = res[0]?.id;

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/lists",
      params: { projectId: serverEvent.projectId },
    });
    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/lists/[listId]",
      params: { projectId: serverEvent.projectId, listId: listId ?? "" },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "create_event_list",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        listId,
        usersCount: serverEvent.project.users.length,
      },
    });

    return listId;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "create_event_list",
      projectId: serverEvent.projectId,
      eventId: serverEvent.id,
    });

    throw new Error("Error creating list");
  }
}

export async function linkEventList(event: Event, listId: string) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);
  const serverList = await requireList(listId);

  if (serverList.projectId !== serverEvent.projectId) {
    throw new Error("List and event are not in the same project");
  }

  try {
    await db
      .update(lists)
      .set({
        eventId: serverEvent.id,
        updatedBy: session.user.id,
      })
      .where(
        and(
          eq(lists.id, serverList.id),
          eq(lists.projectId, serverEvent.projectId),
        ),
      );

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "link_event_list",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        listId: serverList.id,
        usersCount: serverEvent.project.users.length,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "link_event_list",
      listId: serverList.id,
      eventId: serverEvent.id,
    });

    throw new Error("Error linking list");
  }
}

export async function unlinkEventList(event: Event, list: List) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);
  const serverList = await requireList(list.id);

  if (
    serverList.projectId !== serverEvent.projectId ||
    serverList.eventId !== serverEvent.id
  ) {
    throw new Error("List is not linked to the event");
  }

  try {
    await db
      .update(lists)
      .set({
        eventId: null,
      })
      .where(eq(lists.id, serverList.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "unlink_event_list",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        listId: serverList.id,
        usersCount: serverEvent.project.users.length,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "unlink_event_list",
      listId: serverList.id,
      eventId: serverEvent.id,
    });

    throw new Error("Error unlinking list");
  }
}

export async function editEvent(
  event: Event,
  data: v.InferInput<typeof eventSchema>,
  _project: Project,
) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);

  const parsedData = v.parse(eventSchema, data);
  if (
    parsedData.dates.from === undefined ||
    parsedData.dates.to === undefined
  ) {
    throw new Error("Missing dates");
  }

  const startAt = new Date(parsedData.dates.from);
  const endAt = new Date(parsedData.dates.to);

  if (parsedData.allDay) {
    endAt.setUTCDate(endAt.getUTCDate() + 1);
  }

  try {
    await db
      .update(events)
      .set({
        name: parsedData.name,
        description: parsedData.description,
        startAt,
        endAt,
        updatedBy: session.user.id,
      })
      .where(eq(events.id, serverEvent.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar",
      params: { projectId: serverEvent.projectId },
    });
    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "edit_event",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        usersCount: serverEvent.project.users.length,
        hours: (endAt.getTime() - startAt.getTime()) / 3600000,
        allDay: parsedData.allDay,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "edit_event",
      projectId: serverEvent.projectId,
      eventId: serverEvent.id,
    });

    throw new Error("Error editing event");
  }
}

export async function deleteEvent(event: Event) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);

  try {
    await db.delete(events).where(eq(events.id, serverEvent.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar",
      params: { projectId: serverEvent.projectId },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "delete_event",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        usersCount: serverEvent.project.users.length,
        hours:
          (serverEvent.endAt.getTime() - serverEvent.startAt.getTime()) /
          3600000,
        allDay: serverEvent.allDay,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "delete_event",
      projectId: serverEvent.projectId,
      eventId: serverEvent.id,
    });

    throw new Error("Error deleting event");
  }
}

export async function createLinkedNote(event: Event) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);

  try {
    const res = await db
      .insert(notes)
      .values({
        name: serverEvent.name,
        contents: "",
        format: "html",
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        createdBy: session.user.id,
      })
      .returning({ id: notes.id });

    const noteId = res[0]?.id;

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/notes",
      params: { projectId: serverEvent.projectId },
    });
    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "create_event_note",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        noteId,
        usersCount: serverEvent.project.users.length,
      },
    });

    return noteId;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "create_event_note",
      projectId: serverEvent.projectId,
      eventId: serverEvent.id,
    });

    throw new Error("Error creating note");
  }
}

export async function linkEventNote(event: Event, noteId: string) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);
  const serverNote = await requireNote(noteId);

  if (serverNote.projectId !== serverEvent.projectId) {
    throw new Error("Note and event are not in the same project");
  }

  try {
    await db
      .update(notes)
      .set({
        eventId: serverEvent.id,
        updatedBy: session.user.id,
      })
      .where(
        and(
          eq(notes.id, serverNote.id),
          eq(notes.projectId, serverEvent.projectId),
        ),
      );

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "link_event_note",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        noteId: serverNote.id,
        usersCount: serverEvent.project.users.length,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "link_event_note",
      noteId: serverNote.id,
      eventId: serverEvent.id,
    });

    throw new Error("Error linking note");
  }
}

export async function unlinkEventNote(event: Event, note: Note) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);
  const serverNote = await requireNote(note.id);

  if (
    serverNote.projectId !== serverEvent.projectId ||
    serverNote.eventId !== serverEvent.id
  ) {
    throw new Error("Note is not linked to the event");
  }

  try {
    await db
      .update(notes)
      .set({
        eventId: null,
      })
      .where(eq(notes.id, serverNote.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "unlink_event_note",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        noteId: serverNote.id,
        usersCount: serverEvent.project.users.length,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "unlink_event_note",
      noteId: serverNote.id,
      eventId: serverEvent.id,
    });

    throw new Error("Error unlinking note");
  }
}

export async function createLinkedPot(event: Event) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);

  try {
    const [pot] = await db
      .insert(pots)
      .values({
        name: serverEvent.name,
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        createdBy: session.user.id,
      })
      .returning({ id: pots.id });

    if (!pot) {
      throw new Error("Failed to create pot");
    }

    await db.insert(potToUsers).values(
      serverEvent.project.users.map((u) => ({
        potId: pot.id,
        userId: u.userId,
      })),
    );

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/expenses",
      params: { projectId: serverEvent.projectId },
    });
    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "create_event_pot",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        potId: pot.id,
        usersCount: serverEvent.project.users.length,
      },
    });

    return pot.id;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "create_event_pot",
      projectId: serverEvent.projectId,
      eventId: serverEvent.id,
    });

    throw new Error("Error creating pot");
  }
}

export async function linkEventPot(event: Event, potId: string) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);
  const serverPot = await requirePot(potId);

  if (serverPot.projectId !== serverEvent.projectId) {
    throw new Error("Pot and event are not in the same project");
  }

  try {
    await db
      .update(pots)
      .set({
        eventId: serverEvent.id,
      })
      .where(
        and(
          eq(pots.id, serverPot.id),
          eq(pots.projectId, serverEvent.projectId),
        ),
      );

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "link_event_pot",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        potId: serverPot.id,
        usersCount: serverEvent.project.users.length,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "link_event_pot",
      potId: serverPot.id,
      eventId: serverEvent.id,
    });

    throw new Error("Error linking pot");
  }
}

export async function unlinkEventPot(event: Event, pot: Pot) {
  const session = await requireSession();
  const serverEvent = await requireEvent(event.projectId, event.id);
  const serverPot = await requirePot(pot.id);

  if (
    serverPot.projectId !== serverEvent.projectId ||
    serverPot.eventId !== serverEvent.id
  ) {
    throw new Error("Pot is not linked to the event");
  }

  try {
    await db
      .update(pots)
      .set({
        eventId: null,
      })
      .where(eq(pots.id, serverPot.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverEvent.projectId, eventId: serverEvent.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "unlink_event_pot",
      properties: {
        projectId: serverEvent.projectId,
        eventId: serverEvent.id,
        potId: serverPot.id,
        usersCount: serverEvent.project.users.length,
      },
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "unlink_event_pot",
      potId: serverPot.id,
      eventId: serverEvent.id,
    });

    throw new Error("Error unlinking pot");
  }
}
