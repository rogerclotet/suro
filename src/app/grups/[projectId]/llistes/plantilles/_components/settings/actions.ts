"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireSession, requireTemplate } from "@/server/action-auth";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { templateSchema } from "../create-template/data";

export async function deleteTemplate(template: Template) {
  const session = await requireSession();
  const serverTemplate = await requireTemplate(template.id);

  await db.delete(templates).where(eq(templates.id, serverTemplate.id));

  revalidatePath(`/grups/${serverTemplate.projectId}/llistes/plantilles`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_template",
    properties: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
      usersCount: serverTemplate.project.users.length,
      itemsCount: serverTemplate.items.length,
      withCategoryCount: serverTemplate.items.filter(
        (item) => item.category !== null,
      ).length,
    },
  });
}

export async function updateTemplate(
  template: Template,
  data: v.InferInput<typeof templateSchema>,
) {
  const session = await requireSession();
  const serverTemplate = await requireTemplate(template.id);

  const parsedData = v.parse(templateSchema, data);

  await db
    .update(templates)
    .set(parsedData)
    .where(eq(templates.id, serverTemplate.id));

  revalidatePath(`/grups/${serverTemplate.projectId}/llistes/plantilles`);
  revalidatePath(
    `/grups/${serverTemplate.projectId}/llistes/plantilles/${serverTemplate.id}`,
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_template",
    properties: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
      usersCount: serverTemplate.project.users.length,
      itemsCount: serverTemplate.items.length,
      withCategoryCount: serverTemplate.items.filter(
        (item) => item.category !== null,
      ).length,
    },
  });
}
