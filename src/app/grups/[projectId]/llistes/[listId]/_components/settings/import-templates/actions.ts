"use server";

import { revalidatePath } from "next/cache";
import type { Template } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";

export async function importTemplates(
  project: Project,
  listId: string,
  items: Template["items"],
) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (project.users.find((u) => u.user.id === session.user.id) === undefined) {
    throw new Error("The user is not part of the project");
  }

  await db.insert(listItems).values(
    items.map((item) => ({
      listId,
      name: item.name,
      categoryId: item.category,
      createdBy: session.user.id,
    })),
  );

  revalidatePath(`/grups/${project.id}/llistes/${listId}`);
}
