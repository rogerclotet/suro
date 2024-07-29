"use server";

import type { Category } from "@/app/_data/category";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
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
}
