import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./model/auth";
import { CATPPUCCIN_COLOR_KEYS, getRandomColor } from "./model/colors";
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

/**
 * Preview a group from an invite link before joining. Gated by auth only — the
 * caller is by definition not yet a member — but also by the invite token, so it
 * never leaks a group to anyone without the link. Returns null on a bad token.
 */
export const getByInvite = query({
  args: { projectId: v.id("projects"), inviteToken: v.string() },
  handler: async (ctx, { projectId, inviteToken }) => {
    await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null || project.inviteToken !== inviteToken) {
      return null;
    }
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId)),
    );
    return {
      _id: project._id,
      name: project.name,
      color: project.color,
      image: project.image ?? null,
      members: users
        .filter((u) => u !== null)
        .map((u) => ({
          _id: u._id,
          name: u.name ?? null,
          image: u.customImage ?? u.image ?? null,
          avatarColor: u.avatarColor ?? null,
        })),
    };
  },
});

/**
 * Create a new group and add the caller as its first member, atomically. Mirrors
 * the PWA's createProject (and the signup-time "Personal" group): a fresh invite
 * token and a random Catppuccin color. Returns the new project's id so the caller
 * can navigate straight into it.
 */
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireUserId(ctx);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Group name is required");
    }
    const projectId = await ctx.db.insert("projects", {
      name: trimmed,
      createdBy: userId,
      inviteToken: crypto.randomUUID(),
      color: getRandomColor(),
    });
    await ctx.db.insert("projectMembers", { projectId, userId });
    return projectId;
  },
});

/**
 * Join a group via its invite link. Validates the token (and optional expiry),
 * then adds the caller as a member. Idempotent — a no-op if already a member.
 * (The PWA relied on a page guard + the Postgres composite PK; Convex has
 * neither, so the duplicate check is explicit.) Ported from acceptInvite.
 */
export const acceptInvite = mutation({
  args: { projectId: v.id("projects"), inviteToken: v.string() },
  handler: async (ctx, { projectId, inviteToken }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.inviteToken !== inviteToken) {
      throw new Error("Invalid invite token");
    }
    if (
      project.inviteTokenExpiresAt !== undefined &&
      project.inviteTokenExpiresAt < Date.now()
    ) {
      throw new Error("Invite token expired");
    }
    const existing = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", projectId).eq("userId", userId),
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("projectMembers", { projectId, userId });
    }
    return { projectId };
  },
});

/**
 * Edit a group's name and/or color. Creator-only (mirrors editProject). An
 * unknown color key is ignored rather than rejected, matching the PWA.
 */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, color }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.createdBy !== userId) {
      throw new Error("Only the creator can edit this group");
    }
    const patch: { name?: string; color?: string } = {};
    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed === "") {
        throw new Error("Group name is required");
      }
      patch.name = trimmed;
    }
    if (
      color !== undefined &&
      (CATPPUCCIN_COLOR_KEYS as readonly string[]).includes(color)
    ) {
      patch.color = color;
    }
    await ctx.db.patch(projectId, patch);
    return null;
  },
});

/**
 * Leave a group. Any member except the creator may leave — the creator would
 * orphan the group, so they delete it instead (not yet ported). Removes only the
 * caller's own membership row, mirroring the PWA's leaveProject; the user's pot
 * memberships and spendings are intentionally left intact (parity, and dropping
 * them would orphan expense splits). Throws if the caller isn't a member so the
 * UI can surface it.
 */
export const leave = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.createdBy === userId) {
      throw new Error("The creator cannot leave the group");
    }
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", projectId).eq("userId", userId),
      )
      .unique();
    if (membership === null) {
      throw new Error("Not a member of this group");
    }
    await ctx.db.delete(membership._id);
    return null;
  },
});
