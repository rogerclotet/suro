"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { createNotification } from "@/server/notifications";
import { sendNotificationsToUsers } from "@/server/push";

export async function acceptInvite(projectId: string, inviteToken: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      users: { columns: {}, with: { user: true } },
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

  revalidatePath(`/grups/${projectId}`);
  revalidatePath(`/grups/${projectId}/invitacio/${inviteToken}`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "accept_invite",
    properties: {
      projectId: project.id,
      usersCount: project.users.length + 1,
    },
  });

  setTimeout(() => {
    const userName = session.user.name ?? "Algú";
    createNotification({
      type: "member_joined",
      title: project.name,
      body: `${userName} s'ha unit al grup`,
      path: `/grups/${project.id}`,
      section: "grups",
      projectId: project.id,
      createdBy: session.user.id,
    })
      .then(() =>
        sendNotificationsToUsers({
          users: project.users
            .filter((u) => u.user.id !== session.user.id)
            .map((u) => u.user.id),
          body: `${userName} s'ha unit al grup`,
          title: project.name,
          path: `/grups/${project.id}`,
        }),
      )
      .catch((err) => {
        console.error(
          "Failed to send notification after accepting invite",
          err,
        );
      });
  }, 0);
}
