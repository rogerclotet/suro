"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { listItems, lists } from "@/server/db/schema";
import { listSchema } from "../../../_components/create-list/data";

export async function deleteList(list: List) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db.delete(lists).where(eq(lists.id, list.id));

  revalidatePath(`/grups/${list.projectId}/llistes`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_list",
    properties: {
      projectId: list.projectId,
      listId: list.id,
      itemsCount: list.items.length,
      completedItemsCount: list.items.filter((item) => item.completed).length,
      usersCount: list.project.users.length,
    },
  });
}

export async function updateList(
  list: List,
  data: v.InferInput<typeof listSchema>,
) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(listSchema, data);

  await db.update(lists).set(parsedData).where(eq(lists.id, list.id));

  revalidatePath(`/grups/${list.projectId}/llistes`);
  revalidatePath(`/grups/${list.projectId}/llistes/${list.id}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_list",
    properties: {
      projectId: list.projectId,
      listId: list.id,
      itemsCount: list.items.length,
      usersCount: list.project.users.length,
    },
  });
}

export async function clearCompletedItems(list: List) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (
    list.project.users.find((u) => u.userId === session.user.id) === undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db
    .delete(listItems)
    .where(and(eq(listItems.listId, list.id), eq(listItems.completed, true)));

  revalidatePath(`/grups/${list.projectId}/llistes`);
  revalidatePath(`/grups/${list.projectId}/llistes/${list.id}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "clear_completed_items",
    properties: {
      projectId: list.projectId,
      listId: list.id,
      itemsCount: list.items.length,
      completedItemsCount: list.items.filter((item) => item.completed).length,
      usersCount: list.project.users.length,
    },
  });
}
