import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "./db";
import { files, projectToUsers } from "./db/schema";

export default async function getProjectFiles(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  const membership = await db.query.projectToUsers.findFirst({
    columns: { projectId: true },
    where: and(
      eq(projectToUsers.projectId, projectId),
      eq(projectToUsers.userId, session.user.id),
    ),
  });

  if (!membership) {
    return [];
  }

  return await db.query.files.findMany({
    where: eq(files.projectId, projectId),
    with: {
      uploadedBy: true,
      project: {
        with: {
          users: true,
        },
      },
      event: true,
    },
    orderBy: [desc(files.createdAt)],
  });
}

export async function getUserFile(fileId: string) {
  const session = await auth();
  if (!session) {
    return undefined;
  }

  return await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.uploadedBy, session.user.id)),
    with: {
      uploadedBy: true,
      project: {
        with: {
          users: true,
        },
      },
      event: true,
    },
  });
}
