"use server";

import { eq } from "drizzle-orm";
import * as v from "valibot";
import type { Category } from "@/app/_data/category";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { requireCategory, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { categorySchema } from "../../[listId]/_components/categories/data";

export async function editCategory(
  category: Category,
  data: v.InferInput<typeof categorySchema>,
) {
  const session = await requireSession();
  const serverCategory = await requireCategory(category.id);

  const parsedData = v.parse(categorySchema, data);

  await db
    .update(categories)
    .set(parsedData)
    .where(eq(categories.id, serverCategory.id));

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/categories",
    params: { projectId: serverCategory.project.id },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "edit_category",
    properties: {
      projectId: serverCategory.project.id,
      categoryId: serverCategory.id,
      usersCount: serverCategory.project.users.length,
    },
  });
}

export async function deleteCategory(category: Category) {
  const session = await requireSession();
  const serverCategory = await requireCategory(category.id);

  await db.delete(categories).where(eq(categories.id, serverCategory.id));

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/lists/categories",
    params: { projectId: serverCategory.project.id },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "delete_category",
    properties: {
      projectId: serverCategory.project.id,
      categoryId: serverCategory.id,
      usersCount: serverCategory.project.users.length,
    },
  });
}
