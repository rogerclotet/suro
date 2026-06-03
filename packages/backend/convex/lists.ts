import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { instantiateTemplateItems, loadListWithItems } from "./model/lists";
import { requireListAccess, requireProjectMember } from "./model/permissions";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_project_updatedAt", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    return Promise.all(lists.map((list) => loadListWithItems(ctx, list)));
  },
});

export const get = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const { list } = await requireListAccess(ctx, listId);
    const withItems = await loadListWithItems(ctx, list);
    // Surface the linked calendar event (if any) for the detail backlink.
    const event = list.eventId ? await ctx.db.get(list.eventId) : null;
    return { ...withItems, event };
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    templateIds: v.optional(v.array(v.id("listTemplates"))),
  },
  handler: async (ctx, { projectId, name, description, templateIds }) => {
    const userId = await requireProjectMember(ctx, projectId);
    const trimmedName = name.trim();
    if (trimmedName === "") {
      throw new Error("List name is required");
    }
    const now = Date.now();
    const listId = await ctx.db.insert("lists", {
      name: trimmedName,
      description: (description ?? "").trim(),
      projectId,
      favorite: false,
      createdBy: userId,
      updatedAt: now,
    });

    if (templateIds && templateIds.length > 0) {
      const items = await instantiateTemplateItems(ctx, projectId, templateIds);
      for (const item of items) {
        await ctx.db.insert("listItems", {
          name: item.name,
          completed: false,
          listId,
          categoryId: item.categoryId,
          createdBy: userId,
          updatedAt: now,
        });
      }
    }

    return listId;
  },
});

/**
 * Append the items of the selected templates to an existing list (ports
 * importTemplates). Categories are re-resolved within the list's project, so
 * cross-project ids degrade to "no category" — same as create()'s seeding.
 */
export const importTemplates = mutation({
  args: {
    listId: v.id("lists"),
    templateIds: v.array(v.id("listTemplates")),
  },
  handler: async (ctx, { listId, templateIds }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    const items = await instantiateTemplateItems(
      ctx,
      list.projectId,
      templateIds,
    );
    const now = Date.now();
    for (const item of items) {
      await ctx.db.insert("listItems", {
        name: item.name,
        completed: false,
        listId: list._id,
        categoryId: item.categoryId,
        createdBy: userId,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const update = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { listId, name, description }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    const trimmedName = name.trim();
    if (trimmedName === "") {
      throw new Error("List name is required");
    }
    await ctx.db.patch(list._id, {
      name: trimmedName,
      description: (description ?? "").trim(),
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const { list } = await requireListAccess(ctx, listId);
    // Manual cascade (no FK ON DELETE CASCADE in Convex).
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(list._id);
    return null;
  },
});

export const toggleFavorite = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    await ctx.db.patch(list._id, {
      favorite: !list.favorite,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const clearCompleted = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const { list } = await requireListAccess(ctx, listId);
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();
    for (const item of items) {
      if (item.completed) {
        await ctx.db.delete(item._id);
      }
    }
    return null;
  },
});
