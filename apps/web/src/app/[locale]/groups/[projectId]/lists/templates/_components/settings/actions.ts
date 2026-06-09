"use server";

import { eq } from "drizzle-orm";
import * as v from "valibot";
import type { Template } from "@/app/_data/list";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import {
  requireProject,
  requireSession,
  requireTemplate,
} from "@/server/action-auth";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { templateSchema } from "../create-template/data";

export async function deleteTemplate(template: Template) {
  const session = await requireSession();
  const serverTemplate = await requireTemplate(template.id);

  await db.delete(templates).where(eq(templates.id, serverTemplate.id));

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/templates",
    params: { projectId: serverTemplate.projectId },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_template",
    properties: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
      usersCount: 0,
      itemsCount: serverTemplate.items.length,
      withCategoryCount: serverTemplate.items.filter(
        (item) => item.category !== null,
      ).length,
    },
  });
}

export async function exportTemplate(
  template: Template,
  targetProjectId: string,
) {
  const session = await requireSession();
  const serverTemplate = await requireTemplate(template.id);
  const targetProject = await requireProject(targetProjectId);

  const result = await db
    .insert(templates)
    .values({
      name: serverTemplate.name,
      description: serverTemplate.description,
      items: serverTemplate.items,
      createdBy: session.user.id,
      projectId: targetProject.id,
    })
    .returning({ id: templates.id });

  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error exporting template");
  }

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/templates",
    params: { projectId: targetProject.id },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "export_template",
    properties: {
      sourceProjectId: serverTemplate.projectId,
      targetProjectId: targetProject.id,
      templateId: serverTemplate.id,
      itemsCount: serverTemplate.items.length,
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

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/templates",
    params: { projectId: serverTemplate.projectId },
  });
  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/templates/[templateId]",
    params: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
    },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "update_template",
    properties: {
      projectId: serverTemplate.projectId,
      templateId: serverTemplate.id,
      usersCount: 0,
      itemsCount: serverTemplate.items.length,
      withCategoryCount: serverTemplate.items.filter(
        (item) => item.category !== null,
      ).length,
    },
  });
}
