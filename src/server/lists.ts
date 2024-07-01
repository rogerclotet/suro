"use server";

import { auth } from "@/auth";
import assert from "assert";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { listItems, lists, projects } from "./db/schema";

export async function getList(listId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    const result = await db.query.lists.findFirst({
      with: {
        project: {
          with: {
            users: true,
          },
        },
        items: {
          with: {
            category: true,
          },
          orderBy: [
            asc(listItems.completed),
            desc(listItems.updatedAt),
            desc(listItems.createdAt),
          ],
        },
      },
      where: eq(lists.id, listId),
    });

    return result;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function getLists(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const project = await db.query.projects.findFirst({
      with: {
        users: true,
        lists: {
          with: {
            project: {
              with: {
                users: true,
              },
            },
            items: {
              with: {
                category: true,
              },
              orderBy: [asc(listItems.completed), desc(listItems.updatedAt)],
            },
          },
          orderBy: [desc(lists.updatedAt)],
        },
      },
      where: eq(projects.id, projectId),
    });

    if (
      project?.users.find((u) => u.userId === session.user.id) === undefined
    ) {
      throw new Error("Project not found");
    }

    return project.lists;
  } catch (e) {
    console.error(e);
    return [];
  }
}
