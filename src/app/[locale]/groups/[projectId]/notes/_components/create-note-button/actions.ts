"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireProject, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { notes } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
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

  revalidatePath(`/[locale]/groups/${serverProject.id}/notes`, "page");

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
    const params = { name: parsedData.name };
    void (async () => {
      const fallbackBody = await translateNotificationBody(
        "note_created",
        params,
        null,
      );
      await sendProjectNotification({
        project: serverProject,
        body: fallbackBody,
        bodyKey: "note_created",
        bodyParams: params,
        title: serverProject.name,
        path: `/groups/${serverProject.id}/notes/${note.id}`,
        type: "note_created",
        section: "notes",
      });
    })().catch((err) => {
      console.error(
        "Failed to send push notification after creating note",
        err,
      );
    });
  }, 0);

  return note.id;
}
