"use server";

import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { projectSchema } from "./create-project/data";

export async function editProject(
  project: Project,
  data: v.InferInput<typeof projectSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.createdBy !== session.user.id) {
    throw new Error("Only the creator can edit the project");
  }

  const parsed = v.parse(projectSchema, data);

  await db
    .update(projects)
    .set({
      name: parsed.name,
    })
    .where(eq(projects.id, project.id));

  revalidatePath("/projectes");
}

export async function deleteProject(project: Project) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.createdBy !== session.user.id) {
    throw new Error("Only the creator can delete the project");
  }

  await db.delete(projects).where(eq(projects.id, project.id));

  revalidatePath("/projectes");
}
