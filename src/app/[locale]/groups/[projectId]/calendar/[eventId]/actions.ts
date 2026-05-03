"use server";

import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import {
  requireEvent,
  requireList,
  requireSession,
} from "@/server/action-auth";
import { db } from "@/server/db";
import { events, lists } from "@/server/db/schema";
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
