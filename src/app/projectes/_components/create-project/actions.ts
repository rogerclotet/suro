"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { createProjectSchema } from "./data";

export async function createProject(
  data: v.InferInput<typeof createProjectSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const parsedData = v.parse(createProjectSchema, data);

  const result = await db
    .insert(projects)
    .values(parsedData)
    .returning({ id: projects.id });
  if (!result || result.length < 1) {
    throw new Error("Error creating project");
  }

  const project = result[0]!;
  await db
    .insert(projectToUsers)
    .values({ projectId: project.id, userId: session.user.id });

  revalidatePath("/projectes");

  return project.id;
}
