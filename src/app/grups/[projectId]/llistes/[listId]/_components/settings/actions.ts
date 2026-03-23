"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { List } from "@/app/_data/list";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireList, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { listItems, lists } from "@/server/db/schema";
import { listSchema } from "../../../_components/create-list/data";

export async function deleteList(list: List) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  await db.delete(lists).where(eq(lists.id, serverList.id));

  revalidatePath(`/grups/${serverList.projectId}/llistes`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_list",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      itemsCount: serverList.items.length,
      completedItemsCount: serverList.items.filter((item) => item.completed)
        .length,
      usersCount: serverList.project.users.length,
    },
  });
}

export async function updateList(
  list: List,
  data: v.InferInput<typeof listSchema>,
) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  const parsedData = v.parse(listSchema, data);

  await db.update(lists).set(parsedData).where(eq(lists.id, serverList.id));

  revalidatePath(`/grups/${serverList.projectId}/llistes`);
  revalidatePath(`/grups/${serverList.projectId}/llistes/${serverList.id}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_list",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      itemsCount: serverList.items.length,
      usersCount: serverList.project.users.length,
    },
  });
}

export async function toggleFavorite(list: List) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  await db
    .update(lists)
    .set({ favorite: !serverList.favorite })
    .where(eq(lists.id, serverList.id));

  revalidatePath(`/grups/${serverList.projectId}/llistes`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "toggle_favorite_list",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      favorite: !serverList.favorite,
    },
  });
}

export async function clearCompletedItems(list: List) {
  const session = await requireSession();
  const serverList = await requireList(list.id);

  await db
    .delete(listItems)
    .where(
      and(eq(listItems.listId, serverList.id), eq(listItems.completed, true)),
    );

  revalidatePath(`/grups/${serverList.projectId}/llistes`);
  revalidatePath(`/grups/${serverList.projectId}/llistes/${serverList.id}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "clear_completed_items",
    properties: {
      projectId: serverList.projectId,
      listId: serverList.id,
      itemsCount: serverList.items.length,
      completedItemsCount: serverList.items.filter((item) => item.completed)
        .length,
      usersCount: serverList.project.users.length,
    },
  });
}
