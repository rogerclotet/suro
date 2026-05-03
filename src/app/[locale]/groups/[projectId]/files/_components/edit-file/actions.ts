"use server";

import assert from "node:assert";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import type { File } from "@/app/_data/file";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { requireOwnedFile, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { files } from "@/server/db/schema";
import { editFileSchema } from "./schema";

export async function editFile(
  file: File,
  data: v.InferInput<typeof editFileSchema>,
) {
  const session = await requireSession();
  assert(session, "Unauthenticated user");
  const serverFile = await requireOwnedFile(file.id);

  const parsed = v.parse(editFileSchema, data);

  await db
    .update(files)
    .set({ name: parsed.name })
    .where(eq(files.id, serverFile.id));

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/files",
    params: { projectId: serverFile.project.id },
  });

  if (serverFile.eventId) {
    revalidateLocalizedPath({
      pathname: "/groups/[projectId]/calendar/[eventId]",
      params: { projectId: serverFile.project.id, eventId: serverFile.eventId },
    });
  }

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "edit_file",
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
