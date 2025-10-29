"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { notes } from "@/server/db/schema";
import { sendProjectNotification } from "@/server/push";
import { noteSchema } from "./schema";

export async function createNote(
  project: Project,
  data: v.InferInput<typeof noteSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.users.find((u) => u.user.id === session.user.id) === undefined) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(noteSchema, data);

  const result = await db
    .insert(notes)
    .values({
      ...parsedData,
      createdBy: session.user.id,
      projectId: project.id,
    })
    .returning({ id: notes.id });

  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error creating note");
  }

  const note = result[0];

  revalidatePath(`/grups/${project.id}/notes`);

  setTimeout(() => {
    sendProjectNotification({
      project,
      body: `Nova nota: ${parsedData.name}`,
      title: project.name,
      path: `/grups/${project.id}/notes/${note.id}`,
    }).catch((err) => {
      console.error(
        "Failed to send push notification after creating note",
        err,
      );
    });
  }, 0);

  return note.id;
}
