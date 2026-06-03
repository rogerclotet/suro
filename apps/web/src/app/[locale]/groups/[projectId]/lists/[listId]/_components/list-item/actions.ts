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
import { enqueueListNotificationDigest } from "@/server/notification-digests";
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

  revalidatePath(
    `/[locale]/groups/${serverList.projectId}/lists/${serverList.id}`,
    "page",
  );

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

  const userName = session.user.name ?? "Someone";
  setTimeout(() => {
    enqueueListNotificationDigest({
      actorId: session.user.id,
      actorName: userName,
      listId: serverList.id,
      listName: serverList.name,
      project: {
        id: serverList.project.id,
        name: serverList.project.name,
        userIds: serverList.project.users.map((user) => user.userId),
      },
      type: "list_items_added",
    }).catch((err) => {
      console.error("Failed to enqueue list item creation digest", err);
    });
  }, 0);
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
  const existingItem = serverList.items.find((item) => item.id === itemId);

  if (!existingItem) {
    throw new Error("List item not found");
  }

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

  revalidatePath(`/[locale]/groups/${serverList.projectId}/lists`, "page");
  revalidatePath(
    `/[locale]/groups/${serverList.projectId}/lists/${serverList.id}`,
    "page",
  );

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

  if (!existingItem.completed && completed) {
    const userName = session.user.name ?? "Someone";
    setTimeout(() => {
      enqueueListNotificationDigest({
        actorId: session.user.id,
        actorName: userName,
        listId: serverList.id,
        listName: serverList.name,
        project: {
          id: serverList.project.id,
          name: serverList.project.name,
          userIds: serverList.project.users.map((user) => user.userId),
        },
        type: "list_items_completed",
      }).catch((err) => {
        console.error("Failed to enqueue list item completion digest", err);
      });
    }, 0);
  }
}

export async function deleteListItem(list: List, itemId: string) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  await db
    .delete(listItems)
    .where(and(eq(listItems.id, itemId), eq(listItems.listId, serverList.id)));

  revalidatePath(
    `/[locale]/groups/${serverList.projectId}/lists/${serverList.id}`,
    "page",
  );

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
