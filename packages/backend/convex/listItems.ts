import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { track } from "./model/analytics";
import { ensureCategorySuggestion } from "./model/categories";
import { requireItemAccess, requireListAccess } from "./model/permissions";

export const create = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    details: v.optional(v.string()),
    category: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { listId, name, details, category }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    const categoryName = await ensureCategorySuggestion(
      ctx,
      list.projectId,
      category,
    );
    const itemId = await ctx.db.insert("listItems", {
      name,
      details: details?.trim() || undefined,
      completed: false,
      listId: list._id,
      category: categoryName,
      createdBy: userId,
      updatedAt: Date.now(),
    });
    await track(ctx, userId, "list_item_created", {
      projectId: list.projectId,
      hasCategory: categoryName != null,
    });
    return itemId;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("listItems"),
    name: v.string(),
    details: v.optional(v.string()),
    completed: v.boolean(),
    category: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { itemId, name, details, completed, category }) => {
    const { item, list, userId } = await requireItemAccess(ctx, itemId);
    const categoryName = await ensureCategorySuggestion(
      ctx,
      list.projectId,
      category,
    );
    await ctx.db.patch(item._id, {
      name,
      details: details?.trim() || undefined,
      completed,
      category: categoryName,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    // Only the false->true transition is a meaningful "completed" action; plain
    // edits (renames, re-saves of an already-checked item) shouldn't re-fire it.
    if (!item.completed && completed) {
      await track(ctx, userId, "list_item_completed", {
        projectId: list.projectId,
      });
    }
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("listItems") },
  handler: async (ctx, { itemId }) => {
    const { item } = await requireItemAccess(ctx, itemId);
    await ctx.db.delete(item._id);
    return null;
  },
});
