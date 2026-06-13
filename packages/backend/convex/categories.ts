import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
 * Remove a category-name suggestion from the project's autocomplete store.
 * Items keep their plain-string category names; this only drops the suggestion.
 */
export const remove = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    const category = await ctx.db.get(categoryId);
    if (category === null) {
      return null;
    }
    await requireProjectMember(ctx, category.projectId);
    await ctx.db.delete(categoryId);
    return null;
  },
});
