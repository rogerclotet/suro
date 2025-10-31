"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { templateSchema } from "../create-template/data";

export async function deleteTemplate(template: Template) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (
    template.project.users.find((u) => u.userId === session.user.id) ===
    undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db.delete(templates).where(eq(templates.id, template.id));

  revalidatePath(`/grups/${template.projectId}/llistes/plantilles`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_template",
    properties: {
      projectId: template.projectId,
      templateId: template.id,
      usersCount: template.project.users.length,
      itemsCount: template.items.length,
      withCategoryCount: template.items.filter((item) => item.category !== null)
        .length,
    },
  });
}

export async function updateTemplate(
  template: Template,
  data: v.InferInput<typeof templateSchema>,
) {
  const session = await auth();
  if (!session) {
    return;
  }

  if (
    template.project.users.find((u) => u.userId === session.user.id) ===
    undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(templateSchema, data);

  await db
    .update(templates)
    .set(parsedData)
    .where(eq(templates.id, template.id));

  revalidatePath(`/grups/${template.projectId}/llistes/plantilles`);
  revalidatePath(
    `/grups/${template.projectId}/llistes/plantilles/${template.id}`,
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_template",
    properties: {
      projectId: template.projectId,
      templateId: template.id,
      usersCount: template.project.users.length,
      itemsCount: template.items.length,
      withCategoryCount: template.items.filter((item) => item.category !== null)
        .length,
    },
  });
}
