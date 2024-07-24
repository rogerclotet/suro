"use server";

import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { lists } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
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
}
