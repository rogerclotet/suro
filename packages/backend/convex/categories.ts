import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCategorySuggestion } from "./model/categories";
import { requireProjectMember } from "./model/permissions";

/**
 * The project's category-name suggestions (autocomplete for the pickers),
 * sorted by name. Categories themselves live on items as plain name strings.
 */
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
 * Deprecated (drop with listItems.categoryId): pre-rework clients create
 * categories from their pickers. Now just an explicit suggestion upsert,
 * deduped by exact name.
 */
export const create = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, { projectId, name }) => {
    await requireProjectMember(ctx, projectId);
    const normalized = await ensureCategorySuggestion(ctx, projectId, name);
    if (normalized === undefined) {
      throw new Error("Category name is required");
    }
    const suggestion = await ctx.db
      .query("categories")
      .withIndex("by_project_name", (q) =>
        q.eq("projectId", projectId).eq("name", normalized),
      )
      .first();
    if (suggestion === null) {
      throw new Error("Category not found");
    }
    return suggestion._id;
  },
});
