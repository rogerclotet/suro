"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
import { getRandomColor } from "@/lib/catppuccin-colors";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { getUserProject } from "@/server/projects";
import { projectSchema } from "./data";

export async function createProject(data: v.InferInput<typeof projectSchema>) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const parsedData = v.parse(projectSchema, data);

  const result = await db
    .insert(projects)
    .values({
      ...parsedData,
      createdBy: session.user.id,
      color: getRandomColor(),
    })
    .returning({ id: projects.id });
  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error creating project");
  }

  const project = result[0];
  await db
    .insert(projectToUsers)
    .values({ projectId: project.id, userId: session.user.id });

  revalidatePath("/[locale]/groups", "page");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_project",
    properties: {
      projectId: project.id,
    },
  });

  return getUserProject(project.id);
}
