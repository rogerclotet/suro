import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUserId } from "./model/auth";
import { requireProjectMember } from "./model/permissions";

/** Projects (groups) the current user belongs to. Ported from getProjects. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const projects = await Promise.all(
      memberships.map((m) => ctx.db.get(m.projectId)),
    );
    return projects.filter((p) => p !== null);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    return ctx.db.get(projectId);
  },
});
