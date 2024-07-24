"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { templateSchema } from "./data";

export async function createTemplate(
  projectId: string,
  data: v.InferInput<typeof templateSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const parsedData = v.parse(templateSchema, data);

  const result = await db
    .insert(templates)
    .values({ ...parsedData, createdBy: session.user.id, projectId })
    .returning({ id: templates.id });

  if (!result || result.length < 1) {
    throw new Error("Error creating template");
  }

  const template = result[0]!;

  revalidatePath(`/grups/${projectId}/llistes/plantilles`);

  return template.id;
}
