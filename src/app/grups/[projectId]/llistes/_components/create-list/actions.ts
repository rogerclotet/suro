"use server";

import type { TemplateItem } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { listItems, lists, templates } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { listSchema } from "./data";
import { sendPushNotification } from "@/server/push";

export async function createList(
  project: Project,
  data: v.InferInput<typeof listSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (project.users.find((u) => u.user.id === session.user.id) === undefined) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(listSchema, data);

  const result = await db
    .insert(lists)
    .values({
      ...parsedData,
      createdBy: session.user.id,
      projectId: project.id,
    })
    .returning({ id: lists.id });

  if (!result || result.length < 1) {
    throw new Error("Error creating list");
  }

  const list = result[0]!;

  if (parsedData.templates && parsedData.templates.length > 0) {
    const items = await getItems(parsedData.templates, project);

    const itemDataToInsert = items.map<typeof listItems.$inferInsert>(
      (item) => ({
        name: item.name,
        categoryId: item.category !== "" ? item.category : null,
        completed: false,
        createdBy: session.user.id,
        listId: list.id,
      }),
    );

    await db.insert(listItems).values(itemDataToInsert);
  }

  revalidatePath(`/grups/${project.id}/llistes`);

  setTimeout(() => {
    sendPushNotification(
      project,
      `Nova llista: ${parsedData.name}`,
      project.name,
      `/grups/${project.id}/llistes/${list.id}`,
    ).catch((err) => {
      console.error(
        "Failed to send push notification after creating list",
        err,
      );
    });
  }, 0);

  return list.id;
}

async function getItems(templateIds: string[], project: Project) {
  const results = await db.query.templates.findMany({
    where: and(
      inArray(templates.id, templateIds),
      eq(templates.projectId, project.id),
    ),
  });

  return results.flatMap<TemplateItem>(
    (template) => template.items as TemplateItem[],
  );
}
