"use server";

import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "./db";
import { notes, projects } from "./db/schema";

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
        event: true,
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
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_note",
      noteId,
    });
    return undefined;
  }
}

export async function getEventNotes(projectId: string, eventId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const project = await db.query.projects.findFirst({
      with: {
        users: true,
      },
      where: eq(projects.id, projectId),
    });

    if (
      project?.users.find((u) => u.userId === session.user.id) === undefined
    ) {
      throw new Error("Project not found");
    }

    return await db.query.notes.findMany({
      where: and(eq(notes.projectId, projectId), eq(notes.eventId, eventId)),
      orderBy: [desc(notes.updatedAt)],
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_event_notes",
      projectId,
      eventId,
    });
    return [];
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
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_notes",
      projectId,
    });
    return [];
  }
}
