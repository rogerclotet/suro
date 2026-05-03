"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { TemplateItem } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import {
  getProjectCategoryId,
  requireProject,
  requireSession,
} from "@/server/action-auth";
import { db } from "@/server/db";
import { listItems, lists, templates } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
import { sendProjectNotification } from "@/server/push";
import { listSchema } from "./data";

export async function createList(
  project: Project,
  data: v.InferInput<typeof listSchema>,
) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  const parsedData = v.parse(listSchema, data);

  const result = await db
    .insert(lists)
    .values({
      ...parsedData,
      createdBy: session.user.id,
      projectId: serverProject.id,
    })
    .returning({ id: lists.id });

  if (!result || result.length < 1 || !result[0]) {
    throw new Error("Error creating list");
  }

  const list = result[0];

  let items: TemplateItem[] = [];
  if (parsedData.templates && parsedData.templates.length > 0) {
    items = await getItems(parsedData.templates, serverProject.id);

    const itemDataToInsert = await Promise.all(
      items.map(async (item) => ({
        name: item.name,
        categoryId: await getProjectCategoryId(serverProject.id, item.category),
        completed: false,
        createdBy: session.user.id,
        listId: list.id,
      })),
    );

    await db.insert(listItems).values(itemDataToInsert);
  }

  revalidatePath(`/[locale]/groups/${serverProject.id}/lists`, "page");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_list",
    properties: {
      projectId: serverProject.id,
      listId: list.id,
      templatesCount: parsedData.templates?.length ?? 0,
      itemsCount: items.length,
      usersCount: serverProject.users.length,
    },
  });

  setTimeout(() => {
    const params = { name: parsedData.name };
    void (async () => {
      const fallbackBody = await translateNotificationBody(
        "list_created",
        params,
        null,
      );
      await sendProjectNotification({
        project: serverProject,
        body: fallbackBody,
        bodyKey: "list_created",
        bodyParams: params,
        title: serverProject.name,
        path: `/groups/${serverProject.id}/lists/${list.id}`,
        type: "list_created",
        section: "lists",
      });
    })().catch((err) => {
      console.error(
        "Failed to send push notification after creating list",
        err,
      );
    });
  }, 0);

  return list.id;
}

async function getItems(templateIds: string[], projectId: string) {
  const results = await db.query.templates.findMany({
    where: and(
      inArray(templates.id, templateIds),
      eq(templates.projectId, projectId),
    ),
  });

  return results.flatMap<TemplateItem>(
    (template) => template.items as TemplateItem[],
  );
}
