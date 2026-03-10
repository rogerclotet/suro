"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { File } from "@/app/_data/file";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireOwnedFile, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";

export async function deleteFile(file: File) {
  const session = await requireSession();
  const serverFile = await requireOwnedFile(file.id);

  try {
    await db.delete(files).where(eq(files.id, serverFile.id));
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "delete_file",
      projectId: serverFile.project.id,
      eventId: serverFile.eventId,
      fileId: serverFile.id,
    });
    return;
  }

  const fileKey = serverFile.url.split("/").slice(-1);
  try {
    await utapi.deleteFiles(fileKey);
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "delete_file_from_uploadthing",
      projectId: serverFile.project.id,
      eventId: serverFile.eventId,
      fileId: serverFile.id,
    });
  }

  revalidatePath(`/grups/${serverFile.project.id}/fitxers`);

  if (serverFile.eventId) {
    revalidatePath(
      `/grups/${serverFile.project.id}/calendari/${serverFile.eventId}`,
    );
  }

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_file",
    properties: {
      projectId: serverFile.project.id,
      eventId: serverFile.eventId,
      fileId: serverFile.id,
      usersCount: serverFile.project.users.length,
      size: serverFile.size,
      type: serverFile.type,
    },
  });
}
