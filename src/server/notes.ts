"use server";

import { auth } from "@/auth";
import { desc, eq } from "drizzle-orm";
import { Logger } from "next-axiom";
import { db } from "./db";
import { notes, projects } from "./db/schema";

const log = new Logger();

export async function getNote(noteId: string) {
  const session = await auth();
  if (!session) {
    return undefined;
  }

  try {
    const result = await db.query.notes.findFirst({
      with: {
        project: {
          with: {
            users: true,
          },
        },
      },
      where: eq(notes.id, noteId),
    });

    if (
      result?.project.users.find((u) => u.userId === session.user.id) ===
      undefined
    ) {
      throw new Error("Note not found");
    }

    return result;
  } catch (e) {
    log.error("Error getting note", { error: e, noteId });
    await log.flush();
    return undefined;
  }
}

export async function getNotes(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const project = await db.query.projects.findFirst({
      with: {
        users: true,
        notes: {
          orderBy: [desc(notes.updatedAt)],
        },
      },
      where: eq(projects.id, projectId),
    });

    if (
      project?.users.find((u) => u.userId === session.user.id) === undefined
    ) {
      throw new Error("Project not found");
    }

    return project.notes;
  } catch (e) {
    log.error("Error getting notes", { error: e, projectId });
    await log.flush();
    return [];
  }
}
