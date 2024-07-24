"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function acceptInvite(projectId: string, inviteToken: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.inviteToken !== inviteToken) {
    throw new Error("Invalid invite token");
  }

  await db.insert(projectToUsers).values({
    projectId: project.id,
    userId: session.user.id,
  });
}
