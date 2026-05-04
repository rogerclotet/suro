"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
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

  if (
    project.inviteTokenExpiresAt &&
    project.inviteTokenExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("Invite token expired");
  }

  await db.insert(projectToUsers).values({
    projectId: project.id,
    userId: session.user.id,
  });

  revalidatePath(`/[locale]/groups/${projectId}`, "page");
  revalidatePath(
    `/[locale]/groups/${projectId}/invitation/${inviteToken}`,
    "page",
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "accept_invite",
    properties: {
      projectId: project.id,
      usersCount: project.users.length + 1,
    },
  });

  setTimeout(() => {
    const userName =
      session.user.name ??
      // fallback if username is missing — uses default locale
      "?";
    const params = { userName };
    void (async () => {
      const fallbackBody = await translateNotificationBody(
        "member_joined",
        params,
        null,
      );
      await createNotification({
        type: "member_joined",
        title: project.name,
        body: fallbackBody,
        bodyParams: params,
        path: `/groups/${project.id}`,
        section: "groups",
        projectId: project.id,
        createdBy: session.user.id,
      });
      await sendNotificationsToUsers({
        users: project.users
          .filter((u) => u.user.id !== session.user.id)
          .map((u) => u.user.id),
        body: fallbackBody,
        bodyKey: "member_joined",
        bodyParams: params,
        title: project.name,
        path: `/groups/${project.id}`,
      });
    })().catch((err) => {
      console.error("Failed to send notification after accepting invite", err);
    });
  }, 0);
}
