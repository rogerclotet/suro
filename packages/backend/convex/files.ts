import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { serveFileUrl } from "./model/fileUrls";
import { requireFileOwner, requireProjectMember } from "./model/permissions";

/** Attach download URLs (file + any PDF thumbnail), uploader, and event name. */
async function loadFile(ctx: QueryCtx, file: Doc<"files">) {
  const [url, thumbnailUrl, uploader, event] = await Promise.all([
    serveFileUrl(file.storageId, (id) => ctx.storage.getUrl(id), file.name),
    file.thumbnailStorageId
      ? serveFileUrl(file.thumbnailStorageId, (id) => ctx.storage.getUrl(id))
      : Promise.resolve(null),
    ctx.db.get(file.uploadedBy),
    file.eventId ? ctx.db.get(file.eventId) : Promise.resolve(null),
  ]);
  return {
    ...file,
    url,
    thumbnailUrl,
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
    const fileId = await ctx.db.insert("files", {
      name,
      storageId: args.storageId,
      type: args.type,
      size: args.size,
      projectId: args.projectId,
      eventId: args.eventId,
      uploadedBy: userId,
    });
    // Render a page-1 preview off the transaction (Node action, mupdf is WASM).
    if (args.type === "application/pdf") {
      await ctx.scheduler.runAfter(0, internal.pdfThumbnails.generate, {
        fileId,
        storageId: args.storageId,
      });
    }
    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId: args.projectId,
      actorId: userId,
      bodyKey: "file_uploaded",
      bodyParams: { name },
      path: `/${args.projectId}/files`,
    });
    return fileId;
  },
});

/**
 * Attach a rendered PDF thumbnail to its file. Called only by the
 * `pdfThumbnails.generate` action; tolerates the file having been deleted (or
 * re-thumbnailed) meanwhile by dropping the now-orphaned blob.
 */
export const attachThumbnail = internalMutation({
  args: { fileId: v.id("files"), thumbnailStorageId: v.id("_storage") },
  handler: async (ctx, { fileId, thumbnailStorageId }) => {
    const file = await ctx.db.get(fileId);
    if (file === null) {
      await ctx.storage.delete(thumbnailStorageId);
      return null;
    }
    if (file.thumbnailStorageId) {
      await ctx.storage.delete(file.thumbnailStorageId);
    }
    await ctx.db.patch(fileId, { thumbnailStorageId });
    return null;
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
    // Return [] rather than throwing when the event is gone (mirrors
    // events.get): the event detail screen keeps this query subscribed while it
    // navigates away after a delete, and a dangling subscription re-running
    // against the deleted row would otherwise surface an "Event not found"
    // server error on the client.
    const event = await ctx.db.get(eventId);
    if (event === null) {
      return [];
    }
    await requireProjectMember(ctx, event.projectId);
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
    if (file.thumbnailStorageId) {
      await ctx.storage.delete(file.thumbnailStorageId);
    }
    await ctx.db.delete(file._id);
    return null;
  },
});
