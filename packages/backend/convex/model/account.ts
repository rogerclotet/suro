import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Delete a project and everything scoped to it — lists + items, pots + members,
 * files (incl. their stored blobs and thumbnails), the flat project-scoped
 * tables, every membership, and the group image blob. Mirrors `projects.remove`'s
 * cascade but performs no ownership/last-member checks: callers gate access.
 */
export async function deleteProjectCascade(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<void> {
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

  for (const table of [
    "spendings",
    "events",
    "notes",
    "categories",
    "listTemplates",
    "projectMembers",
  ] as const) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  }

  const project = await ctx.db.get(projectId);
  if (project?.imageStorageId) {
    await ctx.storage.delete(project.imageStorageId);
  }
  await ctx.db.delete(projectId);
}

/**
 * Hard-delete a user and every record linked to them, keeping no copies (the
 * privacy-policy promise). Order:
 *   1. Groups the user created → full project cascade (content, members, blobs).
 *      Other members lose those groups — they were the creator's, as the policy
 *      states ("including any groups you created").
 *   2. Memberships in groups created by *others* → removed (the user leaves; the
 *      group and its shared content survive for the remaining members).
 *   3. Pot memberships, push tokens, and the avatar blob.
 *   4. Convex Auth rows: accounts (+ their verification codes) and sessions
 *      (+ their refresh tokens). This signs the user out of every device.
 *   5. The user document itself.
 *
 * Runs in a single mutation/transaction, matching the existing cascade helpers.
 * Authored content in *shared* groups (createdBy/updatedBy pointing here) is left
 * in place as group data; those references resolve to a missing user, which the
 * UI already tolerates.
 */
export async function deleteUserAccount(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const ownedProjects = await ctx.db
    .query("projects")
    .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
    .collect();
  for (const project of ownedProjects) {
    await deleteProjectCascade(ctx, project._id);
  }

  // Memberships that survived the cascade above are in groups owned by others.
  const memberships = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const membership of memberships) {
    await ctx.db.delete(membership._id);
  }

  const potMembers = await ctx.db
    .query("potMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const member of potMembers) {
    await ctx.db.delete(member._id);
  }

  const pushTokens = await ctx.db
    .query("pushTokens")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const token of pushTokens) {
    await ctx.db.delete(token._id);
  }

  const user = await ctx.db.get(userId);
  if (user?.customImageStorageId) {
    await ctx.storage.delete(user.customImageStorageId);
  }

  // Convex Auth tables (spread via `...authTables` in schema.ts).
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  for (const account of accounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect();
    for (const code of codes) {
      await ctx.db.delete(code._id);
    }
    await ctx.db.delete(account._id);
  }

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const refreshToken of refreshTokens) {
      await ctx.db.delete(refreshToken._id);
    }
    await ctx.db.delete(session._id);
  }

  await ctx.db.delete(userId);
}
