"use server";

import type { File } from "@/app/_data/file";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import assert from "assert";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { editFileSchema } from "./schema";

export async function editFile(
  file: File,
  data: v.InferInput<typeof editFileSchema>,
) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  if (file.uploadedBy.id !== session.user.id) {
    throw new Error("Unauthorized");
  }

  const parsed = v.parse(editFileSchema, data);

  await db
    .update(files)
    .set({ name: parsed.name })
    .where(eq(files.id, file.id));

  revalidatePath(`/projectes/${file.project.id}/fitxers`);
}
