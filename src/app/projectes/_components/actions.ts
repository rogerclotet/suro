"use server";

import type { Project } from "@/app/_data/project";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function deleteProject(project: Project) {
  await db.delete(projects).where(eq(projects.id, project.id));
}
