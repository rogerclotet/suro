"use server";

import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { lists } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

  revalidatePath(`/projectes/${list.projectId}/llistes`);
}
