"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireProject, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { notes } from "@/server/db/schema";
import { sendProjectNotification } from "@/server/push";
import { noteSchema } from "./schema";

export async function createNote(
  project: Project,
  data: v.InferInput<typeof noteSchema>,
) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  const parsedData = v.parse(noteSchema, data);

  const result = await db
    .insert(notes)
    .values({
      ...parsedData,
      createdBy: session.user.id,
      projectId: serverProject.id,
    })
    .returning({ id: notes.id });

  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error creating note");
  }

  const note = result[0];

  revalidatePath(`/grups/${serverProject.id}/notes`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_note",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
      noteId: note.id,
      format: parsedData.format,
    },
  });

  setTimeout(() => {
    sendProjectNotification({
      project: serverProject,
      body: `Nova nota: ${parsedData.name}`,
      title: serverProject.name,
      path: `/grups/${serverProject.id}/notes/${note.id}`,
      type: "note_created",
      section: "notes",
    }).catch((err) => {
      console.error(
        "Failed to send push notification after creating note",
        err,
      );
    });
  }, 0);

  return note.id;
}
