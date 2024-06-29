"use server";

import { auth } from "@/auth";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { lists, projects } from "./db/schema";

export async function getList(listId: string) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const result = await db.query.lists.findFirst({
    with: {
      items: true,
    },
    where: eq(lists.id, listId),
  });

  return result;
}

export async function getLists(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  const project = await db.query.projects.findFirst({
    with: {
      users: true,
      lists: {
        with: {
          items: true,
        },
        orderBy: desc(lists.updatedAt),
      },
    },
    where: eq(projects.id, projectId),
  });

  if (project?.users.find((u) => u.userId === session.user.id) === undefined) {
    throw new Error("Project not found");
  }

  return project.lists;
}
