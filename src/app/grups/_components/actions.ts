"use server";

import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
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

  revalidatePath("/grups");
}

export async function deleteProject(project: Project) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.createdBy !== session.user.id) {
    throw new Error("Only the creator can delete the project");
  }

  if (project.users.length > 1) {
    throw new Error("Cannot delete a project with users");
  }

  await db.delete(projects).where(eq(projects.id, project.id));

  revalidatePath("/grups");
}

export async function leaveProject(project: Project) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.createdBy === session.user.id) {
    throw new Error("Cannot leave a project you created");
  }

  if (project.users.length <= 1) {
    throw new Error("Cannot leave a project with only one user");
  }

  await db
    .delete(projectToUsers)
    .where(
      and(
        eq(projectToUsers.projectId, project.id),
        eq(projectToUsers.userId, session.user.id),
      ),
    );

  revalidatePath("/grups");
}
