"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Logger } from "next-axiom";
import * as v from "valibot";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { events, lists } from "@/server/db/schema";
import { eventSchema } from "../_components/event/data";

const log = new Logger();

export async function createLinkedList(event: Event) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  try {
    const res = await db
      .insert(lists)
      .values({
        name: event.name,
        description: `Llista per ${event.name}`,
        projectId: event.projectId,
        eventId: event.id,
        createdBy: session.user.id,
      })
      .returning({ id: lists.id });

    const listId = res[0]!.id;

    revalidatePath(`/grups/${event.projectId}/llistes`);
    revalidatePath(`/grups/${event.projectId}/llistes/${listId}`);

    return listId;
  } catch (e) {
    log.error("Error creating event list", {
      error: e,
      projectId: event.projectId,
      eventId: event.id,
    });
    await log.flush();

    throw new Error("Error creating list");
  }
}

export async function linkEventList(event: Event, listId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  try {
    await db
      .update(lists)
      .set({
        eventId: event.id,
        updatedBy: session.user.id,
      })
      .where(eq(lists.id, listId));

    revalidatePath(`/grups/${event.projectId}/calendari/${event.id}`);
  } catch (e) {
    log.error("Error linking event list", {
      error: e,
      listId,
      eventId: event.id,
    });
    await log.flush();

    throw new Error("Error linking list");
  }
}

export async function unlinkEventList(event: Event, list: List) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  try {
    await db
      .update(lists)
      .set({
        eventId: null,
      })
      .where(eq(lists.id, list.id));

    revalidatePath(`/grups/${event.projectId}/calendari/${event.id}`);
  } catch (e) {
    log.error("Error unlinking event list", {
      error: e,
      projectId: event.projectId,
      listId: list.id,
      eventId: event.id,
    });
    await log.flush();

    throw new Error("Error unlinking list");
  }
}

export async function editEvent(
  event: Event,
  data: v.InferInput<typeof eventSchema>,
  project: Project,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (!project.users.some((u) => u.user.id === session.user.id)) {
    throw new Error("Unauthorized");
  }

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
      .where(eq(events.id, event.id));

    revalidatePath(`/grups/${event.projectId}/llistes/${event.id}`);
  } catch (e) {
    log.error("Error editing event", {
      error: e,
      projectId: event.projectId,
      eventId: event.id,
    });
    await log.flush();

    throw new Error("Error editing event");
  }
}

export async function deleteEvent(event: Event) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (!event.project.users.some((u) => u.userId === session.user.id)) {
    throw new Error("Unauthorized");
  }

  try {
    await db.delete(events).where(eq(events.id, event.id));

    revalidatePath(`/grups/${event.projectId}/calendari`);
  } catch (e) {
    log.error("Error deleting event", {
      error: e,
      projectId: event.projectId,
      eventId: event.id,
    });
    await log.flush();

    throw new Error("Error deleting event");
  }
}
