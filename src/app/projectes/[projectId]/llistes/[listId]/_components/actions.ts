"use server";

import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createListItem(
  list: List,
  name: string,
  completed: boolean,
) {
  const session = await auth();
  if (!session) {
    return;
  }

  // TODO check if the user has access to the list

  await db.insert(listItems).values({
    name,
    completed,
    createdBy: session.user.id,
    listId: list.id,
  });
  revalidatePath(`/projectes/${list.projectId}/llistes/${list.id}`);
}

export async function updateListItem(
  list: List,
  itemId: string,
  name: string,
  completed: boolean,
) {
  const session = await auth();
  if (!session) {
    return;
  }

  // TODO check if the user has access to the list

  await db
    .update(listItems)
    .set({ name, completed, updatedBy: session.user.id })
    .where(eq(listItems.id, itemId));

  revalidatePath(`/projectes/${list.projectId}/llistes/${list.id}`);
}
