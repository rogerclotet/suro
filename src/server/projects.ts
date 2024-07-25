"use server";

import { auth } from "@/auth";
import { and, asc, eq } from "drizzle-orm";
import { Logger } from "next-axiom";
import { db } from "./db";
import { categories, projects, projectToUsers } from "./db/schema";

const log = new Logger();

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
          with: {
            users: { columns: {}, with: { user: true } },
            categories: {
              orderBy: asc(categories.name),
            },
          },
        },
      },
      where: eq(projectToUsers.userId, session.user.id),
    });

    return results.map((result) => result.project);
  } catch (e) {
    log.error("Error getting projects", { error: e });
    await log.flush();
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
          with: {
            users: { columns: {}, with: { user: true } },
            categories: {
              orderBy: asc(categories.name),
            },
          },
        },
      },
      where: and(
        eq(projectToUsers.projectId, projectId),
        eq(projectToUsers.userId, session.user.id),
      ),
    });

    return result?.project;
  } catch (e) {
    log.error("Error getting project", { error: e, projectId });
    await log.flush();
    return null;
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
      with: { users: { columns: {}, with: { user: true } }, categories: true },
      where: and(eq(projects.id, projectId)),
    });

    return result;
  } catch (e) {
    log.error("Error getting invited project", { error: e, projectId });
    await log.flush();
    return null;
  }
}
