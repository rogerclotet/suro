"use server";

import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { projects } from "./db/schema";

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
      },
    },
    where: eq(projects.id, projectId),
  });

  if (project?.users.find((u) => u.userId === session.user.id) === undefined) {
    throw new Error("Project not found");
  }

  return project.lists;
}
