import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { requireUserId } from "./auth";

/**
 * Authorization helpers ported from src/server/action-auth.ts. Every public
 * query/mutation calls exactly one of these first. Non-membership yields the
 * same opaque "not found" errors as the Next.js app.
 */

export async function requireProjectMember(
  ctx: QueryCtx,
  projectId: Id<"projects">,
) {
  const userId = await requireUserId(ctx);
  const membership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId),
    )
    .unique();
  if (membership === null) {
    throw new Error("Project not found");
  }
  return userId;
}

/** Load the list, then authorize via its project (mirrors requireList). */
export async function requireListAccess(ctx: QueryCtx, listId: Id<"lists">) {
  const list = await ctx.db.get(listId);
  if (list === null) {
    throw new Error("List not found");
  }
  const userId = await requireProjectMember(ctx, list.projectId);
  return { list, userId };
}

export async function requireItemAccess(
  ctx: QueryCtx,
  itemId: Id<"listItems">,
) {
  const item = await ctx.db.get(itemId);
  if (item === null) {
    throw new Error("List item not found");
  }
  const { list, userId } = await requireListAccess(ctx, item.listId);
  return { item, list, userId };
}

export async function requireTemplateAccess(
  ctx: QueryCtx,
  templateId: Id<"listTemplates">,
) {
  const template = await ctx.db.get(templateId);
  if (template === null) {
    throw new Error("Template not found");
  }
  const userId = await requireProjectMember(ctx, template.projectId);
  return { template, userId };
}

export async function requireEventAccess(ctx: QueryCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (event === null) {
    throw new Error("Event not found");
  }
  const userId = await requireProjectMember(ctx, event.projectId);
  return { event, userId };
}

export async function requireNoteAccess(ctx: QueryCtx, noteId: Id<"notes">) {
  const note = await ctx.db.get(noteId);
  if (note === null) {
    throw new Error("Note not found");
  }
  const userId = await requireProjectMember(ctx, note.projectId);
  return { note, userId };
}

export async function requirePotAccess(ctx: QueryCtx, potId: Id<"pots">) {
  const pot = await ctx.db.get(potId);
  if (pot === null) {
    throw new Error("Pot not found");
  }
  const userId = await requireProjectMember(ctx, pot.projectId);
  return { pot, userId };
}

/**
 * Ports requireOwnedFile: only the uploader may rename/delete a file. The opaque
 * "not found" (rather than "forbidden") matches the Next.js owner check.
 */
export async function requireFileOwner(ctx: QueryCtx, fileId: Id<"files">) {
  const file = await ctx.db.get(fileId);
  if (file === null) {
    throw new Error("File not found");
  }
  const userId = await requireUserId(ctx);
  if (file.uploadedBy !== userId) {
    throw new Error("File not found");
  }
  return { file, userId };
}

/**
 * Transitional (drop with listItems.categoryId): a category id only "counts"
 * if it belongs to the project; otherwise it's silently dropped (never
 * throws), so stale/foreign category references degrade to "no category"
 * instead of failing the write.
 */
export async function resolveProjectCategoryId(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  categoryId: Id<"categories"> | null | undefined,
) {
  if (!categoryId) {
    return undefined;
  }
  const category = await ctx.db.get(categoryId);
  return category && category.projectId === projectId
    ? category._id
    : undefined;
}
