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

  const results = await db.query.projectToUsers.findMany({
    columns: {},
    with: {
      project: {
        columns: { id: true, name: true, inviteToken: true },
        with: { users: { columns: {}, with: { user: true } } },
      },
    },
    where: eq(projectToUsers.userId, session.user.id),
  });

  return results.map((result) => result.project);
}

export async function getUserProject(projectId: string) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const result = await db.query.projectToUsers.findFirst({
    columns: {},
    with: {
      project: {
        columns: { id: true, name: true, inviteToken: true },
        with: { users: { columns: {}, with: { user: true } } },
      },
    },
    where: and(
      eq(projectToUsers.projectId, projectId),
      eq(projectToUsers.userId, session.user.id),
    ),
  });

  return result?.project;
}

export async function getInvitedProject(projectId: string) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const result = await db.query.projects.findFirst({
    columns: { id: true, name: true, inviteToken: true },
    with: { users: { columns: {}, with: { user: true } } },
    where: and(eq(projects.id, projectId)),
  });

  return result;
}
