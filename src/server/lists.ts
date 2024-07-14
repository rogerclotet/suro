"use server";

import type { Template } from "@/app/_data/list";
import { auth } from "@/auth";
import assert from "assert";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { listItems, lists, projects, templates } from "./db/schema";

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
          orderBy: [asc(listItems.completed), asc(listItems.name)],
        },
        event: true,
      },
      where: eq(lists.id, listId),
    });

    if (
      result?.project.users.find((u) => u.userId === session.user.id) ===
      undefined
    ) {
      throw new Error("List not found");
    }

    return result;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function getEventList(projectId: string, eventId: string) {
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
          orderBy: [asc(listItems.completed), asc(listItems.name)],
        },
        event: true,
      },
      where: and(eq(lists.eventId, eventId), eq(lists.projectId, projectId)),
    });

    if (
      result?.project.users.find((u) => u.userId === session.user.id) ===
      undefined
    ) {
      throw new Error("List not found");
    }

    return result;
  } catch (e) {
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
              orderBy: [asc(listItems.completed), asc(listItems.name)],
            },
            event: true,
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

export async function getTemplate(templateId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    const result = await db.query.templates.findFirst({
      with: {
        project: {
          with: {
            users: true,
          },
        },
      },
      where: eq(templates.id, templateId),
    });

    if (
      result?.project.users.find((u) => u.userId === session.user.id) ===
      undefined
    ) {
      throw new Error("Template not found");
    }

    return result as Template;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function getTemplates(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const project = await db.query.projects.findFirst({
      with: {
        users: true,
        templates: {
          with: {
            project: {
              with: { users: true },
            },
          },
          orderBy: [desc(templates.updatedAt)],
        },
      },
      where: eq(projects.id, projectId),
    });

    if (
      project?.users.find((u) => u.userId === session.user.id) === undefined
    ) {
      throw new Error("Project not found");
    }

    return project.templates.map((t) => ({
      ...t,
      items: t.items as { name: string; category: string | null }[],
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
