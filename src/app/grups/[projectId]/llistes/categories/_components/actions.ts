"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Category } from "@/app/_data/category";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { categorySchema } from "../../[listId]/_components/categories/data";

export async function editCategory(
  category: Category,
  data: v.InferInput<typeof categorySchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!category.project.users.some((u) => u.user.id === session.user.id)) {
    throw new Error("Unauthorized");
  }

  const parsedData = v.parse(categorySchema, data);

  await db
    .update(categories)
    .set(parsedData)
    .where(eq(categories.id, category.id));

  revalidatePath(`/grups/${category.project.id}/llistes/categories`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "edit_category",
    properties: {
      projectId: category.project.id,
      categoryId: category.id,
      usersCount: category.project.users.length,
    },
  });
}

export async function deleteCategory(category: Category) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!category.project.users.some((u) => u.user.id === session.user.id)) {
    throw new Error("Unauthorized");
  }

  await db.delete(categories).where(eq(categories.id, category.id));

  revalidatePath(`/grups/${category.project.id}/llistes/categories`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_category",
    properties: {
      projectId: category.project.id,
      categoryId: category.id,
      usersCount: category.project.users.length,
    },
  });
}
