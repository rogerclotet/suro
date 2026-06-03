import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import {
  requireEventAccess,
  requireFileOwner,
  requireProjectMember,
} from "./model/permissions";

/** Attach a download URL, the uploader's name, and any event name to a row. */
async function loadFile(ctx: QueryCtx, file: Doc<"files">) {
  const [url, uploader, event] = await Promise.all([
    ctx.storage.getUrl(file.storageId),
    ctx.db.get(file.uploadedBy),
    file.eventId ? ctx.db.get(file.eventId) : Promise.resolve(null),
  ]);
  return {
    ...file,
    url,
    uploaderName: uploader?.name ?? null,
    eventName: event?.name ?? null,
  };
}

/**
 * Short-lived URL the client POSTs the file bytes to (Convex storage). Gated by
 * project membership so only members can obtain an upload slot.
 */
export const generateUploadUrl = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    return ctx.storage.generateUploadUrl();
  },
});

/** Persist a file row after the bytes are uploaded (returns the new file id). */
export const saveFile = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const userId = await requireProjectMember(ctx, args.projectId);
    if (args.eventId) {
      const event = await ctx.db.get(args.eventId);
      if (event === null || event.projectId !== args.projectId) {
        throw new Error("Event not found");
      }
    }
    const name = args.name.trim();
    if (name === "") {
      throw new Error("File name is required");
    }
    return ctx.db.insert("files", {
      name,
      storageId: args.storageId,
      type: args.type,
      size: args.size,
      projectId: args.projectId,
      eventId: args.eventId,
      uploadedBy: userId,
    });
  },
});

/** All project files, newest first (ordered by _creationTime). */
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    return Promise.all(files.map((file) => loadFile(ctx, file)));
  },
});

/** Files attached to one event, newest first. */
export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    const files = await ctx.db
      .query("files")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .order("desc")
      .collect();
    return Promise.all(files.map((file) => loadFile(ctx, file)));
  },
});

export const rename = mutation({
  args: { fileId: v.id("files"), name: v.string() },
  handler: async (ctx, { fileId, name }) => {
    const { file } = await requireFileOwner(ctx, fileId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("File name is required");
    }
    await ctx.db.patch(file._id, { name: trimmed });
    return null;
  },
});

export const remove = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, { fileId }) => {
    const { file } = await requireFileOwner(ctx, fileId);
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(file._id);
    return null;
  },
});
