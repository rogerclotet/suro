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

/** Members of a project, as the avatar fields the UI needs. */
export const members = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId)),
    );
    return users
      .filter((u) => u !== null)
      .map((u) => ({
        _id: u._id,
        name: u.name ?? null,
        image: u.customImage ?? u.image ?? null,
        avatarColor: u.avatarColor ?? null,
      }));
  },
});
