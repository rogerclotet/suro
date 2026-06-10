import { v } from "convex/values";
import { query } from "./_generated/server";
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
