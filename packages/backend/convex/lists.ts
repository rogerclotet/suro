import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { track } from "./model/analytics";
import { ensureCategorySuggestions } from "./model/categories";
import {
  instantiateTemplateItems,
  type ListWithItems,
  loadListWithItems,
} from "./model/lists";
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

function isCompleted(list: ListWithItems) {
  return list.items.length > 0 && list.items.every((item) => item.completed);
}

/**
 * The mobile lists overview: every favorite and unfinished list, plus a page
 * of the most recently completed ones. Completed-ness is derived from items,
 * so the query still reads the whole project's lists — `completedLimit` trims
 * the payload, not the scan; fine at a group's scale. "Show more" re-runs the
 * query with a larger limit.
 */
export const overviewByProject = query({
  args: { projectId: v.id("projects"), completedLimit: v.number() },
  handler: async (ctx, { projectId, completedLimit }) => {
    await requireProjectMember(ctx, projectId);
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_project_updatedAt", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
    const withItems = await Promise.all(
      lists.map((list) => loadListWithItems(ctx, list)),
    );
    // Completed favorites stay pinned in the overview's Favorites section.
    const active = withItems.filter((l) => l.favorite || !isCompleted(l));
    const completed = withItems.filter((l) => !l.favorite && isCompleted(l));
    // "Most recently completed" is when the last item was checked: completing
    // an item bumps only the item's updatedAt, not the list document's.
    const completedAt = (list: ListWithItems) =>
      Math.max(list.updatedAt, ...list.items.map((item) => item.updatedAt));
    completed.sort((a, b) => completedAt(b) - completedAt(a));
    const limit = Math.max(0, Math.floor(completedLimit));
    return {
      active,
      completed: completed.slice(0, limit),
      hasMoreCompleted: completed.length > limit,
    };
  },
});

export const get = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    // Return null rather than throwing when the list is gone: the detail
    // screen keeps this query subscribed while it animates out after a delete,
    // and a dangling subscription re-running against the deleted row would
    // otherwise surface a "List not found" server error on the client.
    const list = await ctx.db.get(listId);
    if (list === null) {
      return null;
    }
    await requireProjectMember(ctx, list.projectId);
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
      await ensureCategorySuggestions(
        ctx,
        projectId,
        items.map((item) => item.category),
      );
      for (const item of items) {
        await ctx.db.insert("listItems", {
          name: item.name,
          completed: false,
          listId,
          category: item.category,
          createdBy: userId,
          updatedAt: now,
        });
      }
    }

    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId,
      actorId: userId,
      bodyKey: "list_created",
      bodyParams: { name: trimmedName },
      path: `/${projectId}/lists`,
    });
    await track(ctx, userId, "list_created", {
      projectId,
      hasTemplates: (templateIds?.length ?? 0) > 0,
    });

    return listId;
  },
});

/**
 * Append the items of the selected templates to an existing list (ports
 * importTemplates). Item category names are copied as-is and recorded as
 * suggestions in the list's project — same as create()'s seeding.
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
    await ensureCategorySuggestions(
      ctx,
      list.projectId,
      items.map((item) => item.category),
    );
    const now = Date.now();
    for (const item of items) {
      await ctx.db.insert("listItems", {
        name: item.name,
        completed: false,
        listId: list._id,
        category: item.category,
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
    const { list, userId } = await requireListAccess(ctx, listId);
    // Manual cascade (no FK ON DELETE CASCADE in Convex).
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(list._id);
    await track(ctx, userId, "list_deleted", { projectId: list.projectId });
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
    await track(ctx, userId, "list_favorite_toggled", {
      projectId: list.projectId,
      favorite: !list.favorite,
    });
    return null;
  },
});

export const clearCompleted = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const { list, userId } = await requireListAccess(ctx, listId);
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();
    for (const item of items) {
      if (item.completed) {
        await ctx.db.delete(item._id);
      }
    }
    await track(ctx, userId, "list_cleared_completed", {
      projectId: list.projectId,
    });
    return null;
  },
});
