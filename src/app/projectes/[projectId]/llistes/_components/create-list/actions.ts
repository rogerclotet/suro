"use server";

import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { lists } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { createListSchema } from "./data";

export async function createList(
  projectId: Project["id"],
  data: v.InferInput<typeof createListSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  const parsedData = v.parse(createListSchema, data);

  const result = await db
    .insert(lists)
    .values({ ...parsedData, createdBy: session.user.id, projectId })
    .returning({ id: lists.id });

  if (!result || result.length < 1) {
    throw new Error("Error creating list");
  }

  const list = result[0]!;

  revalidatePath(`/projectes/${projectId}/llistes`);

  return list.id;
}
