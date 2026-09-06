import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { requireNoteAccess, requireProjectMember } from "./model/permissions";

const LEASE_MS = 60_000;

function findLock(ctx: QueryCtx, noteId: Id<"notes">) {
  return ctx.db
    .query("noteEditLocks")
    .withIndex("by_note", (q) => q.eq("noteId", noteId))
    .unique();
}

// Keep this subscription separate from note contents: heartbeats should not
// invalidate every project note list or reset an editor's local draft.
export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.db.get(noteId);
    if (!note) return null;
    await requireProjectMember(ctx, note.projectId);
    const lock = await findLock(ctx, noteId);
    if (!lock) return null;
    const user = await ctx.db.get(lock.userId);
    // Expiry is a scheduled database write, so readers update without polling.
    return { editorName: user?.name ?? null };
  },
});

export const acquire = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const { note, userId } = await requireNoteAccess(ctx, noteId);
    const existing = await findLock(ctx, noteId);
    if (existing && existing.expiresAt > Date.now()) return null;
    if (existing) await ctx.db.delete(existing._id);
    const expiresAt = Date.now() + LEASE_MS;
    const lockId = await ctx.db.insert("noteEditLocks", {
      noteId,
      userId,
      expiresAt,
    });
    await ctx.scheduler.runAt(expiresAt, internal.noteEditLocks.expire, {
      lockId,
    });
    return { lockId, expiresAt, note };
  },
});

export const renew = mutation({
  args: { lockId: v.id("noteEditLocks") },
  handler: async (ctx, { lockId }) => {
    const lock = await ctx.db.get(lockId);
    if (!lock) return null;
    const { userId } = await requireNoteAccess(ctx, lock.noteId);
    if (lock.userId !== userId || lock.expiresAt <= Date.now()) return null;
    const expiresAt = Date.now() + LEASE_MS;
    await ctx.db.patch(lockId, { expiresAt });
    return expiresAt;
  },
});

export const release = mutation({
  args: { lockId: v.id("noteEditLocks") },
  handler: async (ctx, { lockId }) => {
    const lock = await ctx.db.get(lockId);
    if (!lock) return null;
    const note = await ctx.db.get(lock.noteId);
    if (!note) return null; // The scheduled expiry cleans up deleted notes.
    const userId = await requireProjectMember(ctx, note.projectId);
    if (lock.userId === userId) await ctx.db.delete(lockId);
    return null;
  },
});

export const expire = internalMutation({
  args: { lockId: v.id("noteEditLocks") },
  handler: async (ctx, { lockId }) => {
    const lock = await ctx.db.get(lockId);
    if (!lock) return;
    if (lock.expiresAt <= Date.now()) {
      await ctx.db.delete(lockId);
    } else {
      await ctx.scheduler.runAt(lock.expiresAt, internal.noteEditLocks.expire, {
        lockId,
      });
    }
  },
});

export async function requireEditingLock(
  ctx: QueryCtx,
  noteId: Id<"notes">,
  userId: Id<"users">,
  lockId: Id<"noteEditLocks"> | undefined,
) {
  const lock = lockId ? await ctx.db.get(lockId) : null;
  if (
    !lock ||
    lock.noteId !== noteId ||
    lock.userId !== userId ||
    lock.expiresAt <= Date.now()
  ) {
    throw new Error("A current editing lock is required to save this note");
  }
}
