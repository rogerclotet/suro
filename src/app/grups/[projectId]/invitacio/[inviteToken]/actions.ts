"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";

export async function acceptInvite(projectId: string, inviteToken: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    extras: {
      usersCount: db
        .$count(projectToUsers, eq(projectToUsers.projectId, projectId))
        .as("usersCount"),
    },
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

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "accept_invite",
    properties: {
      projectId: project.id,
      usersCount: project.usersCount + 1,
    },
  });
}
