import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireCategoryAccess,
  requireProjectMember,
} from "./model/permissions";

/** Project categories, sorted by name (mirrors the PWA's alphabetical order). */
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Same as listByProject, but each category carries its `itemCount` — used by the
 * management screen, which shows "N items" per category (ported from
 * getCategories' `items: { id }[]` projection).
 */
export const listWithCounts = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const withCounts = await Promise.all(
      categories.map(async (category) => {
        const items = await ctx.db
          .query("listItems")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();
        return { ...category, itemCount: items.length };
      }),
    );
    return withCounts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, { projectId, name }) => {
    await requireProjectMember(ctx, projectId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Category name is required");
    }
    return ctx.db.insert("categories", { name: trimmed, projectId });
  },
});

export const update = mutation({
  args: { categoryId: v.id("categories"), name: v.string() },
  handler: async (ctx, { categoryId, name }) => {
    const { category } = await requireCategoryAccess(ctx, categoryId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Category name is required");
    }
    await ctx.db.patch(category._id, { name: trimmed });
    return null;
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    const { category } = await requireCategoryAccess(ctx, categoryId);
    // Mirror ON DELETE SET NULL: orphan the items (keep them), then delete.
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_category", (q) => q.eq("categoryId", category._id))
      .collect();
    for (const item of items) {
      await ctx.db.patch(item._id, { categoryId: undefined });
    }
    await ctx.db.delete(category._id);
    return null;
  },
});
