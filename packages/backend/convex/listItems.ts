import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation } from "./_generated/server";
import { ensureCategorySuggestion } from "./model/categories";
import {
  requireItemAccess,
  requireListAccess,
  resolveProjectCategoryId,
} from "./model/permissions";

/**
 * Transitional (drop with listItems.categoryId): resolve the item's category
 * name from the new string arg, falling back to the deprecated `categoryId`
 * sent by clients still running the pre-rework bundle.
 */
async function resolveCategoryName(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  category: string | null | undefined,
  legacyCategoryId: Id<"categories"> | null | undefined,
): Promise<string | undefined> {
  if (category !== undefined) {
    return ensureCategorySuggestion(ctx, projectId, category);
  }
  const resolved = await resolveProjectCategoryId(
    ctx,
    projectId,
    legacyCategoryId,
  );
  if (resolved === undefined) {
    return undefined;
  }
  const doc = await ctx.db.get(resolved);
  return doc?.name;
}

export const create = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    details: v.optional(v.string()),
    category: v.optional(v.union(v.string(), v.null())),
    // Deprecated: pre-rework clients send the category as an id. Drop together
    // with listItems.categoryId.
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
  },
  handler: async (ctx, { listId, name, details, category, categoryId }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    const categoryName = await resolveCategoryName(
      ctx,
      list.projectId,
      category,
      categoryId,
    );
    return ctx.db.insert("listItems", {
      name,
      details: details?.trim() || undefined,
      completed: false,
      listId: list._id,
      category: categoryName,
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id("listItems"),
    name: v.string(),
    details: v.optional(v.string()),
    completed: v.boolean(),
    category: v.optional(v.union(v.string(), v.null())),
    // Deprecated: see create.
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
  },
  handler: async (
    ctx,
    { itemId, name, details, completed, category, categoryId },
  ) => {
    const { item, list, userId } = await requireItemAccess(ctx, itemId);
    const categoryName = await resolveCategoryName(
      ctx,
      list.projectId,
      category,
      categoryId,
    );
    await ctx.db.patch(item._id, {
      name,
      details: details?.trim() || undefined,
      completed,
      category: categoryName,
      // Clear the legacy FK on any touched item so the cleanup stage can drop
      // the field without waiting on the backfill.
      categoryId: undefined,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("listItems") },
  handler: async (ctx, { itemId }) => {
    const { item } = await requireItemAccess(ctx, itemId);
    await ctx.db.delete(item._id);
    return null;
  },
});
