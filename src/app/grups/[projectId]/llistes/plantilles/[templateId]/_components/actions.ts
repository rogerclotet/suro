"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import type { templateItemSchema } from "../../_components/create-template/data";

export async function createTemplateItem(
  template: Template,
  data: v.InferInput<typeof templateItemSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (
    template.project.users.find((u) => u.userId === session.user.id) ===
    undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db
    .update(templates)
    .set({ items: [...template.items, data] })
    .where(eq(templates.id, template.id));

  revalidatePath(
    `/grups/${template.projectId}/llistes/plantilles/${template.id}`,
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_template_item",
    properties: {
      projectId: template.projectId,
      templateId: template.id,
      usersCount: template.project.users.length,
      hasCategory: !!data.category,
    },
  });
}

export async function updateTemplateItems(
  template: Template,
  items: Template["items"],
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (
    template.project.users.find((u) => u.userId === session.user.id) ===
    undefined
  ) {
    throw new Error("The user is not part of the project");
  }

  await db
    .update(templates)
    .set({ items })
    .where(eq(templates.id, template.id));

  revalidatePath(
    `/grups/${template.projectId}/llistes/plantilles/${template.id}`,
  );

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_template_items",
    properties: {
      projectId: template.projectId,
      templateId: template.id,
      usersCount: template.project.users.length,
      itemsCount: items.length,
      withCategoryCount: items.filter((item) => item.category !== null).length,
    },
  });
}
