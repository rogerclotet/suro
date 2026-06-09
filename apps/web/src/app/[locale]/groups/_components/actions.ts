"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireProject, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
import { sendProjectNotification } from "@/server/push";

export async function deleteProject(project: Project) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  if (serverProject.createdBy !== session.user.id) {
    throw new Error("Only the creator can delete the project");
  }

  if (serverProject.users.length > 1) {
    throw new Error("Cannot delete a project with users");
  }

  await db.delete(projects).where(eq(projects.id, serverProject.id));

  revalidatePath("/[locale]/groups", "page");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_project",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
    },
  });
}

export async function leaveProject(project: Project) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  if (serverProject.createdBy === session.user.id) {
    throw new Error("Cannot leave a project you created");
  }

  if (serverProject.users.length <= 1) {
    throw new Error("Cannot leave a project with only one user");
  }

  await db
    .delete(projectToUsers)
    .where(
      and(
        eq(projectToUsers.projectId, serverProject.id),
        eq(projectToUsers.userId, session.user.id),
      ),
    );

  revalidatePath("/[locale]/groups", "page");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "leave_project",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
    },
  });

  const userName = session.user.name ?? "?";
  setTimeout(() => {
    const params = { userName };
    void (async () => {
      const fallbackBody = await translateNotificationBody(
        "member_left",
        params,
        null,
      );
      await sendProjectNotification({
        project: serverProject,
        body: fallbackBody,
        bodyKey: "member_left",
        bodyParams: params,
        title: serverProject.name,
        path: `/groups/${serverProject.id}`,
        type: "member_left",
        section: "groups",
      });
    })().catch((err) => {
      console.error("Failed to send notification after leaving project", err);
    });
  }, 0);
}
