"use server";

import type { Event } from "@/app/_data/event";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { lists } from "@/server/db/schema";
import { revalidatePath } from "next/cache";

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

    revalidatePath(`/projectes/${event.projectId}/llistes`);
    revalidatePath(`/projectes/${event.projectId}/llistes/${listId}`);

    return listId;
  } catch (e) {
    console.error(e);
    throw new Error("Error creating list");
  }
}
