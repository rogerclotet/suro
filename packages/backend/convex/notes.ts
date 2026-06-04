import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { requireNoteAccess, requireProjectMember } from "./model/permissions";

/** Attach the creator's and last-editor's display names to a note row. */
async function loadNote(ctx: QueryCtx, note: Doc<"notes">) {
  const [creator, updater] = await Promise.all([
    ctx.db.get(note.createdBy),
    note.updatedBy ? ctx.db.get(note.updatedBy) : Promise.resolve(null),
  ]);
  return {
    ...note,
    creatorName: creator?.name ?? null,
    updaterName: updater?.name ?? null,
  };
}

/** All project notes, most recently updated first. */
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_project_updatedAt", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    return Promise.all(notes.map((note) => loadNote(ctx, note)));
  },
});

export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    // Return null rather than throwing when the note is gone: the editor keeps
    // this query subscribed while it navigates away after a delete, and a
    // dangling subscription re-running against the deleted row would otherwise
    // surface a "Note not found" server error on the client.
    const note = await ctx.db.get(noteId);
    if (note === null) {
      return null;
    }
    await requireProjectMember(ctx, note.projectId);
    return loadNote(ctx, note);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    contents: v.optional(v.string()),
    format: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, contents, format }) => {
    const userId = await requireProjectMember(ctx, projectId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Note name is required");
    }
    return ctx.db.insert("notes", {
      name: trimmed,
      contents: contents ?? "",
      format: format ?? "plain",
      projectId,
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    name: v.string(),
    contents: v.string(),
    // The mobile editor now saves Tiptap HTML (matching the web app), so it
    // sends `format: "html"`. Omitted by older/plain-text callers, which leaves
    // the stored format untouched.
    format: v.optional(v.string()),
  },
  handler: async (ctx, { noteId, name, contents, format }) => {
    const { note, userId } = await requireNoteAccess(ctx, noteId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Note name is required");
    }
    await ctx.db.patch(note._id, {
      name: trimmed,
      contents,
      ...(format === undefined ? {} : { format }),
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const { note } = await requireNoteAccess(ctx, noteId);
    await ctx.db.delete(note._id);
    return null;
  },
});
