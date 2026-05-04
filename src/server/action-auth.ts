"use server";

import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { auth } from "@/auth";
import { getCategory } from "./categories";
import { db } from "./db";
import { categories, projectToUsers } from "./db/schema";
import { getEvent } from "./events";
import { getUserFile } from "./files";
import { getList, getTemplate } from "./lists";
import { getNote } from "./notes";
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

export async function requireProjectMembership(projectId: string) {
  const session = await requireSession();
  if (!(await isProjectMember(projectId, session.user.id))) {
    throw new Error("Project not found");
  }

  return session;
}

export async function requireCategory(categoryId: string) {
  const category = await getCategory(categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  return category;
}

export async function requireList(listId: string) {
  const list = await getList(listId);
  if (!list) {
    throw new Error("List not found");
  }

  return list;
}

export async function requireTemplate(templateId: string) {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  return template;
}

export async function requireEvent(projectId: string, eventId: string) {
  const event = await getEvent(projectId, eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  return event;
}

export async function requireNote(noteId: string) {
  const note = await getNote(noteId);
  if (!note) {
    throw new Error("Note not found");
  }

  return note;
}

export async function requireOwnedFile(fileId: string) {
  const file = await getUserFile(fileId);
  if (!file) {
    throw new Error("File not found");
  }

  return file;
}

export async function getProjectCategoryId(
  projectId: string,
  categoryId: string | null | undefined,
) {
  if (!categoryId) {
    return null;
  }

  const category = await db.query.categories.findFirst({
    columns: { id: true },
    where: and(
      eq(categories.id, categoryId),
      eq(categories.projectId, projectId),
    ),
  });

  return category?.id ?? null;
}
