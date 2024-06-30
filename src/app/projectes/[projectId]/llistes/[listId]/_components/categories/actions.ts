"use server";

import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import * as v from "valibot";
import { categorySchema } from "./data";

export async function createCategory(
  project: Project,
  data: v.InferInput<typeof categorySchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.users.find((u) => u.user.id === session.user.id) === undefined) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(categorySchema, data);

  const result = await db
    .insert(categories)
    .values({
      ...parsedData,
      projectId: project.id,
    })
    .returning({ id: categories.id });

  return result[0]!.id;
}
