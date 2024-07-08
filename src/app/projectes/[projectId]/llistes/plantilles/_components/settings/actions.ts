"use server";

import type { Template } from "@/app/_data/list";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
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

  revalidatePath(`/projectes/${template.projectId}/llistes/plantilles`);
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

  revalidatePath(`/projectes/${template.projectId}/llistes/plantilles`);
  revalidatePath(
    `/projectes/${template.projectId}/llistes/plantilles/${template.id}`,
  );
}
