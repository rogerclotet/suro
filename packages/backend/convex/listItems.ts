import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  requireItemAccess,
  requireListAccess,
  resolveProjectCategoryId,
} from "./model/permissions";

export const create = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    details: v.optional(v.string()),
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
  },
  handler: async (ctx, { listId, name, details, categoryId }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    const resolved = await resolveProjectCategoryId(
      ctx,
      list.projectId,
      categoryId ?? undefined,
    );
    return ctx.db.insert("listItems", {
      name,
      details: details?.trim() || undefined,
      completed: false,
      listId: list._id,
      categoryId: resolved,
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id("listItems"),
    name: v.string(),
    details: v.optional(v.string()),
    completed: v.boolean(),
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
  },
  handler: async (ctx, { itemId, name, details, completed, categoryId }) => {
    const { item, list, userId } = await requireItemAccess(ctx, itemId);
    const resolved = await resolveProjectCategoryId(
      ctx,
      list.projectId,
      categoryId ?? undefined,
    );
    await ctx.db.patch(item._id, {
      name,
      details: details?.trim() || undefined,
      completed,
      categoryId: resolved,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
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
