import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { categories } from "./db/schema";
import { getUserProject } from "./projects";

export async function getCategories(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  const project = await getUserProject(projectId);
  if (!project) {
    return [];
  }

  const results = await db.query.categories.findMany({
    where: eq(categories.projectId, projectId),
    with: {
      items: {
        columns: { id: true },
      },
    },
  });

  return results.map((r) => ({ ...r, project }));
}
