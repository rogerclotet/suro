"use server";

import { eq } from "drizzle-orm";
import * as v from "valibot";
import type { Note } from "@/app/_data/note";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { requireNote, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { notes } from "@/server/db/schema";
import { noteSchema } from "../_components/create-note-button/schema";

export async function editNote(
  note: Note,
  data: v.InferInput<typeof noteSchema>,
) {
  const session = await requireSession();
  const serverNote = await requireNote(note.id);

  const parsedData = v.parse(noteSchema, data);

  try {
    await db
      .update(notes)
      .set({
        name: parsedData.name,
        contents: parsedData.contents,
        format: parsedData.format,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, serverNote.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/notes",
      params: { projectId: serverNote.projectId },
    });
    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/notes/[noteId]",
      params: { projectId: serverNote.projectId, noteId: serverNote.id },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "edit_note",
      properties: {
        projectId: serverNote.projectId,
        noteId: serverNote.id,
        format: parsedData.format,
      },
    });
  } catch (e) {
    getPostHogServer().captureException(e, session.user.id, {
      action: "edit_note",
      projectId: serverNote.projectId,
      noteId: serverNote.id,
    });

    throw new Error("Error editing note");
  }
}

export async function deleteNote(note: Note) {
  const session = await requireSession();
  const serverNote = await requireNote(note.id);

  try {
    await db.delete(notes).where(eq(notes.id, serverNote.id));

    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/notes",
      params: { projectId: serverNote.projectId },
    });

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "delete_note",
      properties: {
        projectId: serverNote.projectId,
        noteId: serverNote.id,
      },
    });
  } catch (e) {
    getPostHogServer().captureException(e, session.user.id, {
      action: "delete_note",
      projectId: serverNote.projectId,
      noteId: serverNote.id,
    });

    throw new Error("Error deleting note");
  }
}
