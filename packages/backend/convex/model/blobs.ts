import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Load an uploaded blob's metadata, throwing unless no document references it
 * yet.
 *
 * Storage ids are not secrets: every `/f?id=` URL and every file row exposes
 * one, and Convex does not record who uploaded a blob. A mutation that adopts a
 * client-supplied id must therefore prove nothing else owns it. Otherwise a
 * caller could attach another member's file or avatar to their own row and
 * destroy it through the ordinary replace/remove path, which deletes the blob.
 *
 * The failure is the same opaque "not found" as a missing upload, so the check
 * does not confirm which ids exist.
 */
export async function requireUnclaimedBlob(
  ctx: QueryCtx,
  storageId: Id<"_storage">,
) {
  const metadata = await ctx.db.system.get(storageId);
  if (metadata === null) {
    throw new Error("Uploaded file not found");
  }
  const [file, thumbnail, avatar, groupImage] = await Promise.all([
    ctx.db
      .query("files")
      .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
      .first(),
    ctx.db
      .query("files")
      .withIndex("by_thumbnailStorageId", (q) =>
        q.eq("thumbnailStorageId", storageId),
      )
      .first(),
    ctx.db
      .query("users")
      .withIndex("by_customImageStorageId", (q) =>
        q.eq("customImageStorageId", storageId),
      )
      .first(),
    ctx.db
      .query("projects")
      .withIndex("by_imageStorageId", (q) => q.eq("imageStorageId", storageId))
      .first(),
  ]);
  if (file ?? thumbnail ?? avatar ?? groupImage) {
    throw new Error("Uploaded file not found");
  }
  return metadata;
}
