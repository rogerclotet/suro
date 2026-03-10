"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { List } from "@/app/_data/list";
import { getPostHogServer } from "@/lib/posthog-server";
import {
  getProjectCategoryId,
  requireList,
  requireSession,
} from "@/server/action-auth";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";
import { listItemSchema } from "./data";

export async function createListItem(
  list: List,
  data: v.InferInput<typeof listItemSchema>,
) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  const parsed = v.parse(listItemSchema, data);

  await db.insert(listItems).values({
    name: parsed.name,
    completed: false,
    createdBy: session.user.id,
    listId: serverList.id,
    categoryId: await getProjectCategoryId(
      serverList.projectId,
      parsed.categoryId,
    ),
  });

  revalidatePath(`/grups/${serverList.projectId}/llistes/${serverList.id}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_list_item",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      itemsCount: serverList.items.length + 1,
      usersCount: serverList.project.users.length,
      hasCategory: !!parsed.categoryId,
    },
  });
}

export async function updateListItem(
  list: List,
  itemId: string,
  name: string,
  details: string,
  completed: boolean,
  categoryId: string | null,
) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  await db
    .update(listItems)
    .set({
      name,
      details,
      completed,
      categoryId: await getProjectCategoryId(serverList.projectId, categoryId),
      updatedBy: session.user.id,
    })
    .where(and(eq(listItems.id, itemId), eq(listItems.listId, serverList.id)));

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_list_item",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      itemsCount: serverList.items.length,
      usersCount: serverList.project.users.length,
      hasCategory: !!categoryId,
      completed: completed,
    },
  });
}

export async function deleteListItem(list: List, itemId: string) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  await db
    .delete(listItems)
    .where(and(eq(listItems.id, itemId), eq(listItems.listId, serverList.id)));

  revalidatePath(`/grups/${serverList.projectId}/llistes/${serverList.id}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_list_item",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      itemsCount: serverList.items.length - 1,
      usersCount: serverList.project.users.length,
    },
  });
}
