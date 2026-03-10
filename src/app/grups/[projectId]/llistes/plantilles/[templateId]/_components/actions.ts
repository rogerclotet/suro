"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { getPostHogServer } from "@/lib/posthog-server";
import { requireSession, requireTemplate } from "@/server/action-auth";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import type { templateItemSchema } from "../../_components/create-template/data";

export async function createTemplateItem(
  template: Template,
  data: v.InferInput<typeof templateItemSchema>,
) {
  const session = await requireSession();
  const serverTemplate = await requireTemplate(template.id);

  await db
    .update(templates)
    .set({ items: [...serverTemplate.items, data] })
    .where(eq(templates.id, serverTemplate.id));

  revalidatePath(
    `/grups/${serverTemplate.projectId}/llistes/plantilles/${serverTemplate.id}`,
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_template_item",
    properties: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
      usersCount: serverTemplate.project.users.length,
      hasCategory: !!data.category,
    },
  });
}

export async function updateTemplateItems(
  template: Template,
  items: Template["items"],
) {
  const session = await requireSession();
  const serverTemplate = await requireTemplate(template.id);

  await db
    .update(templates)
    .set({ items })
    .where(eq(templates.id, serverTemplate.id));

  revalidatePath(
    `/grups/${serverTemplate.projectId}/llistes/plantilles/${serverTemplate.id}`,
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_template_items",
    properties: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
      usersCount: serverTemplate.project.users.length,
      itemsCount: items.length,
      withCategoryCount: items.filter((item) => item.category !== null).length,
    },
  });
}
