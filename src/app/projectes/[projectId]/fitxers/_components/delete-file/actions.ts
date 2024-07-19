"use server";

import type { File } from "@/app/_data/file";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteFile(file: File) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (file.uploadedBy.id !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(files).where(eq(files.id, file.id));

  const fileKey = file.url.split("/").slice(-1);
  try {
    await utapi.deleteFiles(fileKey);
  } catch (e) {
    console.error("Error deleting file from uploadthing", e);
  }

  revalidatePath(`/projectes/${file.project.id}/fitxers`);
  
  if (file.eventId) {
    revalidatePath(`/projectes/${file.project.id}/calendari/${file.eventId}`);
  }
}
