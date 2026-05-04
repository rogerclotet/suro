"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
import { getUserProject } from "@/server/projects";
import { sendProjectNotification } from "@/server/push";
import { templateSchema } from "./data";

export async function createTemplate(
  projectId: string,
  data: v.InferInput<typeof templateSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const project = await getUserProject(projectId);

  if (!project) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(templateSchema, data);

  const result = await db
    .insert(templates)
    .values({ ...parsedData, createdBy: session.user.id, projectId })
    .returning({ id: templates.id });

  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error creating template");
  }

  const template = result[0];

  revalidatePath(`/[locale]/groups/${projectId}/lists/templates`, "page");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_template",
    properties: {
      projectId: projectId,
      usersCount: project.users.length,
      templateId: template.id,
    },
  });

  setTimeout(() => {
    const params = { name: parsedData.name };
    void (async () => {
      const fallbackBody = await translateNotificationBody(
        "template_created",
        params,
        null,
      );
      await sendProjectNotification({
        project,
        body: fallbackBody,
        bodyKey: "template_created",
        bodyParams: params,
        title: project.name,
        path: `/groups/${project.id}/lists/templates/${template.id}`,
        type: "template_created",
        section: "lists",
      });
    })().catch((err) => {
      console.error(
        "Failed to send push notification after creating template",
        err,
      );
    });
  }, 0);

  return template.id;
}
