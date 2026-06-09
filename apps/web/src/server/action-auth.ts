"use server";

import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { auth } from "@/auth";
import { db } from "./db";
import { projectToUsers } from "./db/schema";
import { getUserProject } from "./projects";

export async function requireSession() {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  return session;
}

export async function requireProject(projectId: string) {
  const project = await getUserProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

export const isProjectMember = cache(
  async (projectId: string, userId: string) => {
    const membership = await db.query.projectToUsers.findFirst({
      columns: { projectId: true },
      where: and(
        eq(projectToUsers.projectId, projectId),
        eq(projectToUsers.userId, userId),
      ),
    });

    return Boolean(membership);
  },
);
