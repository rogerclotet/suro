"use server";

import type { Template } from "@/app/_data/list";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { templates } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type * as v from "valibot";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { templateItemSchema } from "../../_components/create-template/data";

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
    `/projectes/${template.projectId}/llistes/plantilles/${template.id}`,
  );
}
