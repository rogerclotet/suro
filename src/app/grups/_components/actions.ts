"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireProject, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { projects, projectToUsers } from "@/server/db/schema";
import { sendProjectNotification } from "@/server/push";
import { utapi } from "@/server/uploadthing";

const editProjectSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  color: v.optional(v.string()),
});

export async function editProject(
  project: Project,
  data: v.InferInput<typeof editProjectSchema>,
) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  if (serverProject.createdBy !== session.user.id) {
    throw new Error("Only the creator can edit the project");
  }

  const parsed = v.parse(editProjectSchema, data);

  await db
    .update(projects)
    .set({
      name: parsed.name,
      ...(parsed.color ? { color: parsed.color } : {}),
    })
    .where(eq(projects.id, project.id));

  revalidatePath("/");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "edit_project",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
    },
  });
}

export async function removeProjectImage(projectId: string) {
  const session = await requireSession();
  const serverProject = await requireProject(projectId);

  if (serverProject.createdBy !== session.user.id) {
    throw new Error("Only the creator can edit the project");
  }

  if (serverProject.image) {
    const key = serverProject.image.split("/").pop();
    if (key) {
      await utapi.deleteFiles([key]);
    }
  }

  await db
    .update(projects)
    .set({ image: null })
    .where(eq(projects.id, projectId));

  revalidatePath("/");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "remove_project_image",
    properties: { projectId },
  });
}

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

  revalidatePath("/grups");

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

  revalidatePath("/grups");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "leave_project",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
    },
  });

  const userName = session.user.name ?? "Algú";
  setTimeout(() => {
    sendProjectNotification({
      project: serverProject,
      body: `${userName} ha deixat el grup`,
      title: serverProject.name,
      path: `/grups/${serverProject.id}`,
      type: "member_left",
      section: "grups",
    }).catch((err) => {
      console.error("Failed to send notification after leaving project", err);
    });
  }, 0);
}
