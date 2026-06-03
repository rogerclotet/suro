"use server";

import type { Template } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import {
  getProjectCategoryId,
  requireList,
  requireProject,
  requireSession,
} from "@/server/action-auth";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";

export async function importTemplates(
  project: Project,
  listId: string,
  items: Template["items"],
) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);
  const serverList = await requireList(listId);

  if (serverList.projectId !== serverProject.id) {
    throw new Error("List is not part of the project");
  }

  const itemsToInsert = await Promise.all(
    items.map(async (item) => ({
      listId,
      name: item.name,
      categoryId: await getProjectCategoryId(serverProject.id, item.category),
      createdBy: session.user.id,
    })),
  );
  await db.insert(listItems).values(itemsToInsert);

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/[listId]",
    params: { projectId: serverProject.id, listId },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "import_templates",
    properties: {
      projectId: serverProject.id,
      listId,
      itemsCount: items.length,
      usersCount: serverProject.users.length,
    },
  });
}
