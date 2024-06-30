"use server";

import type { List } from "@/app/_data/list";
import type { Category } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createListItem(
  list: List,
  name: string,
  completed: boolean,
  category?: Category,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db.insert(listItems).values({
    name,
    completed,
    createdBy: session.user.id,
    listId: list.id,
    categoryId: category?.id ?? null,
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
    throw new Error("Not logged in");
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db
    .update(listItems)
    .set({ name, completed, updatedBy: session.user.id })
    .where(eq(listItems.id, itemId));

  revalidatePath(`/projectes/${list.projectId}/llistes/${list.id}`);
}

export async function updateListItemCategory(
  list: List,
  itemId: string,
  category: Category | null,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db
    .update(listItems)
    .set({ categoryId: category?.id ?? null, updatedBy: session.user.id })
    .where(eq(listItems.id, itemId));

  revalidatePath(`/projectes/${list.projectId}/llistes/${list.id}`);
}

export async function deleteListItem(list: List, itemId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db.delete(listItems).where(eq(listItems.id, itemId));

  revalidatePath(`/projectes/${list.projectId}/llistes/${list.id}`);
}
