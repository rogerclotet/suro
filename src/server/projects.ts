"use server";

import { auth } from "@/auth";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { projects, projectToUsers } from "./db/schema";

export async function getProjects() {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const results = await db.query.projectToUsers.findMany({
      columns: {},
      with: {
        project: {
          columns: { id: true, name: true, createdBy: true, inviteToken: true },
          with: { users: { columns: {}, with: { user: true } } },
        },
      },
      where: eq(projectToUsers.userId, session.user.id),
    });

    return results.map((result) => result.project);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getUserProject(projectId: string) {
  const session = await auth();
  if (!session) {
    return null;
  }

  try {
    const result = await db.query.projectToUsers.findFirst({
      columns: {},
      with: {
        project: {
          columns: { id: true, name: true, createdBy: true, inviteToken: true },
          with: { users: { columns: {}, with: { user: true } } },
        },
      },
      where: and(
        eq(projectToUsers.projectId, projectId),
        eq(projectToUsers.userId, session.user.id),
      ),
    });

    return result?.project;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function getInvitedProject(projectId: string) {
  const session = await auth();
  if (!session) {
    return null;
  }

  try {
    const result = await db.query.projects.findFirst({
      columns: { id: true, name: true, createdBy: true, inviteToken: true },
      with: { users: { columns: {}, with: { user: true } } },
      where: and(eq(projects.id, projectId)),
    });

    return result;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
