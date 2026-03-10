"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireProject, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { categorySchema } from "./data";

export async function createCategory(
  project: Project,
  data: v.InferInput<typeof categorySchema>,
) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  const parsedData = v.parse(categorySchema, data);

  const result = await db
    .insert(categories)
    .values({
      ...parsedData,
      projectId: serverProject.id,
    })
    .returning({ id: categories.id });

  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error creating category");
  }

  revalidatePath(`/grups/${serverProject.id}/llistes/categories`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_category",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
      categoryId: result[0].id,
    },
  });

  return result[0].id;
}
