"use server";

import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { listItemSchema } from "./data";

export async function createListItem(
  list: List,
  data: v.InferInput<typeof listItemSchema>,
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

  const parsed = v.parse(listItemSchema, data);

  await db.insert(listItems).values({
    name: parsed.name,
    completed: false,
    createdBy: session.user.id,
    listId: list.id,
    categoryId: parsed.categoryId ?? null,
  });

  revalidatePath(`/projectes/${list.projectId}/llistes/${list.id}`);
}

export async function updateListItem(
  list: List,
  itemId: string,
  name: string,
  completed: boolean,
  categoryId: string | null,
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
    .set({ name, completed, categoryId, updatedBy: session.user.id })
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
