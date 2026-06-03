import { eq } from "drizzle-orm";
import { auth } from "@/auth";
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

export async function getCategory(categoryId: string) {
  const session = await auth();
  if (!session) {
    return undefined;
  }

  const result = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
    with: {
      items: {
        columns: { id: true },
      },
      project: {
        columns: { id: true, name: true, createdBy: true, inviteToken: true },
        with: {
          users: { columns: {}, with: { user: true } },
          categories: true,
        },
      },
    },
  });

  if (
    result?.project.users.find((u) => u.user.id === session.user.id) ===
    undefined
  ) {
    return undefined;
  }

  return result;
}
