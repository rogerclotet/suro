"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
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

  const result = await db.insert(projects).values(parsedData).returning();
  if (!result || result.length < 1) {
    throw new Error("Error creating project");
  }

  const project = result[0]!;

  await db
    .insert(projectToUsers)
    .values({ projectId: project.id, userId: session.user.id });

  const fullProject = await db.query.projects.findFirst({
    columns: { id: true, name: true, inviteToken: true },
    with: { users: { columns: {}, with: { user: true } } },
    where: eq(projects.id, project.id),
  });

  if (!fullProject) {
    throw new Error("Error creating project");
  }

  return fullProject;
}
