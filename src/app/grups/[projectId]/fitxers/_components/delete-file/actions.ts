"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { File } from "@/app/_data/file";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";

export async function deleteFile(file: File) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (file.uploadedBy.id !== session.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    await db.delete(files).where(eq(files.id, file.id));
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session?.user.id, {
      action: "delete_file",
      projectId: file.project.id,
      eventId: file.eventId,
      fileId: file.id,
    });
    return;
  }

  const fileKey = file.url.split("/").slice(-1);
  try {
    await utapi.deleteFiles(fileKey);
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session?.user.id, {
      action: "delete_file_from_uploadthing",
      projectId: file.project.id,
      eventId: file.eventId,
      fileId: file.id,
    });
  }

  revalidatePath(`/grups/${file.project.id}/fitxers`);

  if (file.eventId) {
    revalidatePath(`/grups/${file.project.id}/calendari/${file.eventId}`);
  }

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_file",
    properties: {
      projectId: file.project.id,
      eventId: file.eventId,
      fileId: file.id,
      usersCount: file.project.users.length,
      size: file.size,
      type: file.type,
    },
  });
}
