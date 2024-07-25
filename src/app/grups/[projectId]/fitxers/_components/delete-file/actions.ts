"use server";

import type { File } from "@/app/_data/file";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";
import { eq } from "drizzle-orm";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";

export async function deleteFile(file: File) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (file.uploadedBy.id !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const log = new Logger();

  try {
    await db.delete(files).where(eq(files.id, file.id));
  } catch (e) {
    log.error("Error deleting file", {
      error: e,
      projectId: file.project.id,
      fileId: file.id,
    });
    await log.flush();
    return;
  }

  const fileKey = file.url.split("/").slice(-1);
  try {
    await utapi.deleteFiles(fileKey);
  } catch (e) {
    log.error("Error deleting file from uploadthing", {
      error: e,
      projectId: file.project.id,
      fileId: file.id,
      eventId: file.eventId,
    });
  }

  revalidatePath(`/grups/${file.project.id}/fitxers`);

  if (file.eventId) {
    revalidatePath(`/grups/${file.project.id}/calendari/${file.eventId}`);
  }
}
