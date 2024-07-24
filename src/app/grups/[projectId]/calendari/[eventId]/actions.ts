"use server";

import type { Event } from "@/app/_data/event";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { events, lists } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { List } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { eq } from "drizzle-orm";
import { editEventSchema } from "../_components/event/data";

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
    console.error(e);
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
    console.error(e);
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
    console.error(e);
    throw new Error("Error unlinking list");
  }
}

export async function editEvent(
  event: Event,
  data: v.InferInput<typeof editEventSchema>,
  project: Project,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (!project.users.some((u) => u.user.id === session.user.id)) {
    throw new Error("Unauthorized");
  }

  const parsedData = v.parse(editEventSchema, data);

  try {
    await db
      .update(events)
      .set({
        name: parsedData.name,
        description: parsedData.description,
        updatedBy: session.user.id,
      })
      .where(eq(events.id, event.id));

    revalidatePath(`/grups/${event.projectId}/llistes/${event.id}`);
  } catch (e) {
    console.error(e);
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
    console.error(e);
    throw new Error("Error deleting event");
  }
}
