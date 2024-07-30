import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { files } from "./db/schema";

export default async function getProjectFiles(projectId: string) {
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
