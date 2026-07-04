import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { track } from "./model/analytics";
import { requireUserId } from "./model/auth";
import { CATPPUCCIN_COLOR_KEYS, getRandomColor } from "./model/colors";
import { serveFileUrl } from "./model/fileUrls";
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

/**
 * Projects the current user belongs to, each with its categories and members
 * embedded. Powers the PWA's project store (which needs member avatars and
 * categories for every group up-front); native uses the lean `listMine`.
 */
export const listMineDetailed = query({
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
    return Promise.all(
      projects
        .filter((p) => p !== null)
        .map(async (project) => {
          const categories = await ctx.db
            .query("categories")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();
          categories.sort((a, b) => a.name.localeCompare(b.name));
          const memberRows = await ctx.db
            .query("projectMembers")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();
          const members = (
            await Promise.all(memberRows.map((m) => ctx.db.get(m.userId)))
          )
            .filter((u) => u !== null)
            .map((u) => ({
              _id: u._id,
              name: u.name ?? null,
              image: u.customImage ?? u.image ?? null,
              avatarColor: u.avatarColor ?? null,
            }));
          return { ...project, categories, members };
        }),
    );
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
 * Public (unauthenticated) preview of a group behind an invite link, for link
 * unfurling — the OpenGraph card WhatsApp/Telegram render when the link is
 * shared. Unlike getByInvite this skips the auth check on purpose: the crawler
 * is never signed in, and the invite token is itself the bearer credential
 * (anyone with the link is meant to be able to see the group and join). Returns
 * only what a preview needs — no member ids — and null on a bad token.
 */
export const getInvitePreview = query({
  args: { projectId: v.id("projects"), inviteToken: v.string() },
  handler: async (ctx, { projectId, inviteToken }) => {
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
      name: project.name,
      color: project.color,
      image: project.image ?? null,
      members: users
        .filter((u) => u !== null)
        .map((u) => ({
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
    await track(ctx, userId, "group_created", { projectId });
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
      const user = await ctx.db.get(userId);
      await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
        projectId,
        actorId: userId,
        bodyKey: "member_joined",
        bodyParams: { userName: user?.name ?? "" },
        path: `/group-settings?projectId=${projectId}`,
      });
      await track(ctx, userId, "group_joined", { projectId });
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
    const user = await ctx.db.get(userId);
    await ctx.db.delete(membership._id);
    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId,
      actorId: userId,
      bodyKey: "member_left",
      bodyParams: { userName: user?.name ?? "" },
      path: `/group-settings?projectId=${projectId}`,
    });
    await track(ctx, userId, "group_left", { projectId });
    return null;
  },
});

/**
 * Short-lived URL the client POSTs new group-image bytes to (Convex storage).
 * Creator-only — mirrors the Uploadthing groupImageUploader gate.
 */
export const generateImageUploadUrl = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.createdBy !== userId) {
      throw new Error("Only the creator can edit this group");
    }
    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Persist a freshly uploaded group image: store its serving URL in `image` and
 * the storage id for later cleanup. Deletes the previous upload, if any.
 * Creator-only. Mirrors users.setAvatarImage.
 */
export const setImage = mutation({
  args: { projectId: v.id("projects"), storageId: v.id("_storage") },
  handler: async (ctx, { projectId, storageId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.createdBy !== userId) {
      throw new Error("Only the creator can edit this group");
    }
    const rawUrl = await ctx.storage.getUrl(storageId);
    if (rawUrl === null) {
      throw new Error("Uploaded image not found");
    }
    const url =
      (await serveFileUrl(storageId, () => Promise.resolve(rawUrl))) ?? rawUrl;
    if (project.imageStorageId) {
      await ctx.storage.delete(project.imageStorageId);
    }
    await ctx.db.patch(projectId, { image: url, imageStorageId: storageId });
    return null;
  },
});

/**
 * Remove the group image (and its stored blob, if uploaded via Convex).
 * Creator-only. Mirrors users.removeAvatarImage.
 */
export const removeImage = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.createdBy !== userId) {
      throw new Error("Only the creator can edit this group");
    }
    if (project.imageStorageId) {
      await ctx.storage.delete(project.imageStorageId);
    }
    await ctx.db.patch(projectId, {
      image: undefined,
      imageStorageId: undefined,
    });
    return null;
  },
});

/**
 * Delete a group and all its data. Creator-only, and only once they are the
 * sole remaining member (mirrors the PWA's deleteProject — a shared group must
 * be emptied first). Convex has no FK ON DELETE CASCADE, so every project-scoped
 * table is cleared manually, including child rows (listItems, potMembers) and
 * stored file/image blobs.
 */
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.createdBy !== userId) {
      throw new Error("Only the creator can delete this group");
    }
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    if (members.length > 1) {
      throw new Error("Cannot delete a group with other members");
    }

    // Lists + their items.
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const list of lists) {
      const items = await ctx.db
        .query("listItems")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(list._id);
    }

    // Pots + their members.
    const pots = await ctx.db
      .query("pots")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const pot of pots) {
      const potMembers = await ctx.db
        .query("potMembers")
        .withIndex("by_pot", (q) => q.eq("potId", pot._id))
        .collect();
      for (const member of potMembers) {
        await ctx.db.delete(member._id);
      }
      await ctx.db.delete(pot._id);
    }

    // Files (+ their stored blobs and thumbnails).
    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const file of files) {
      await ctx.storage.delete(file.storageId);
      if (file.thumbnailStorageId) {
        await ctx.storage.delete(file.thumbnailStorageId);
      }
      await ctx.db.delete(file._id);
    }

    // Flat project-scoped tables.
    const spendings = await ctx.db
      .query("spendings")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const spending of spendings) {
      await ctx.db.delete(spending._id);
    }
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }
    const events = await ctx.db
      .query("events")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    const templates = await ctx.db
      .query("listTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const template of templates) {
      await ctx.db.delete(template._id);
    }
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Memberships, the group image blob, then the project itself.
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    if (project.imageStorageId) {
      await ctx.storage.delete(project.imageStorageId);
    }
    await ctx.db.delete(projectId);
    await track(ctx, userId, "group_deleted", { projectId });
    return null;
  },
});
