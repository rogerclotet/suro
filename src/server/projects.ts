import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "./db";
import {
  categories,
  projects,
  projectToUsers,
  secretSantas,
} from "./db/schema";

const projectQuery = {
  columns: {},
  with: {
    project: {
      columns: {
        id: true,
        name: true,
        createdBy: true,
        inviteToken: true,
        image: true,
        color: true,
        features: true,
      },
      with: {
        users: { columns: {}, with: { user: true } },
        categories: {
          orderBy: asc(categories.name),
        },
        secretSantas: {
          columns: { assignmentsDone: true, datetime: true },
          orderBy: desc(secretSantas.datetime),
          where: isNull(secretSantas.archivedAt),
          limit: 1,
        },
      },
    },
  },
} as const;

export const getProjects = cache(async () => {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const results = await db.query.projectToUsers.findMany({
      ...projectQuery,
      where: eq(projectToUsers.userId, session.user.id),
    });

    return results.map((result) => result.project);
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_projects",
    });
    return [];
  }
});

export const getUserProject = cache(async (projectId: string) => {
  const session = await auth();
  if (!session) {
    return null;
  }

  try {
    const result = await db.query.projectToUsers.findFirst({
      ...projectQuery,
      where: and(
        eq(projectToUsers.projectId, projectId),
        eq(projectToUsers.userId, session.user.id),
      ),
    });

    return result?.project;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_project",
      projectId,
    });
    return null;
  }
});

export const getInvitedProject = cache(async (projectId: string) => {
  const session = await auth();
  if (!session) {
    return null;
  }

  try {
    const result = await db.query.projects.findFirst({
      columns: {
        id: true,
        name: true,
        createdBy: true,
        inviteToken: true,
        image: true,
        color: true,
        features: true,
      },
      with: {
        users: { columns: {}, with: { user: true } },
        categories: true,
        secretSantas: {
          columns: { assignmentsDone: true, datetime: true },
          orderBy: desc(secretSantas.datetime),
          where: isNull(secretSantas.archivedAt),
          limit: 1,
        },
      },
      where: and(eq(projects.id, projectId)),
    });

    return result;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_invited_project",
      projectId,
    });
    return null;
  }
});

export const getProjectByInvite = cache(
  async (projectId: string, inviteToken: string) => {
    try {
      const result = await db.query.projects.findFirst({
        columns: {
          id: true,
          name: true,
          createdBy: true,
          inviteToken: true,
          image: true,
          color: true,
          features: true,
        },
        with: {
          users: { columns: {}, with: { user: true } },
          categories: true,
          secretSantas: {
            columns: { assignmentsDone: true, datetime: true },
            orderBy: desc(secretSantas.datetime),
            where: isNull(secretSantas.archivedAt),
            limit: 1,
          },
        },
        where: and(
          eq(projects.id, projectId),
          eq(projects.inviteToken, inviteToken),
        ),
      });

      return result;
    } catch (e) {
      const session = await auth();
      const posthog = getPostHogServer();
      posthog.captureException(e, session?.user.id, {
        action: "get_project_by_invite",
        projectId,
      });
      return null;
    }
  },
);
