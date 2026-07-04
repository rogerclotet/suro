import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { track } from "./model/analytics";
import { ensureCategorySuggestion } from "./model/categories";
import {
  assertProjectMembership,
  requireItemAccess,
  requireListAccess,
} from "./model/permissions";
import {
  advanceDueAt,
  priorityValidator,
  recurrenceValidator,
} from "./model/tasks";

/** The optional task fields shared by create and update (only set on task lists). */
const taskFieldArgs = {
  dueAt: v.optional(v.number()),
  dueAllDay: v.optional(v.boolean()),
  assigneeId: v.optional(v.id("users")),
  priority: v.optional(priorityValidator),
  recurrence: v.optional(recurrenceValidator),
};

export const create = mutation({
  args: {
    listId: v.id("lists"),
    name: v.string(),
    details: v.optional(v.string()),
    category: v.optional(v.union(v.string(), v.null())),
    ...taskFieldArgs,
  },
  handler: async (ctx, args) => {
    const { listId, name, details, category } = args;
    const { list, userId } = await requireListAccess(ctx, listId);
    const categoryName = await ensureCategorySuggestion(
      ctx,
      list.projectId,
      category,
    );
    if (args.assigneeId !== undefined) {
      await assertProjectMembership(ctx, list.projectId, args.assigneeId);
    }
    const itemId = await ctx.db.insert("listItems", {
      name,
      details: details?.trim() || undefined,
      completed: false,
      listId: list._id,
      category: categoryName,
      createdBy: userId,
      updatedAt: Date.now(),
      dueAt: args.dueAt,
      dueAllDay: args.dueAllDay,
      assigneeId: args.assigneeId,
      priority: args.priority,
      recurrence: args.recurrence,
    });
    if (args.assigneeId !== undefined && args.assigneeId !== userId) {
      await ctx.scheduler.runAfter(0, internal.push.sendToUsers, {
        userIds: [args.assigneeId],
        projectId: list.projectId,
        bodyKey: "task_assigned",
        bodyParams: { name },
        path: `/${list.projectId}/lists/${list._id}`,
      });
    }
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
    ...taskFieldArgs,
  },
  handler: async (ctx, args) => {
    const { itemId, name, details, completed, category } = args;
    const { item, list, userId } = await requireItemAccess(ctx, itemId);
    const categoryName = await ensureCategorySuggestion(
      ctx,
      list.projectId,
      category,
    );
    if (args.assigneeId !== undefined) {
      await assertProjectMembership(ctx, list.projectId, args.assigneeId);
    }

    // A recurring task that's being checked off doesn't complete — it advances to
    // its next occurrence and stays open. Keyed off the *incoming* recurrence so
    // clearing the repeat in the same edit lets the task complete normally.
    if (args.recurrence !== undefined && completed && !item.completed) {
      const now = Date.now();
      await ctx.db.patch(item._id, {
        name,
        details: details?.trim() || undefined,
        completed: false,
        category: categoryName,
        dueAt: advanceDueAt(args.dueAt ?? now, args.recurrence, now),
        dueAllDay: args.dueAllDay,
        assigneeId: args.assigneeId,
        priority: args.priority,
        recurrence: args.recurrence,
        reminderSentForDueAt: undefined,
        updatedBy: userId,
        updatedAt: now,
      });
      await track(ctx, userId, "task_rescheduled", {
        projectId: list.projectId,
      });
      return null;
    }

    // Moving the due date re-arms the reminder for the new moment.
    const reminderSentForDueAt =
      args.dueAt === item.dueAt ? item.reminderSentForDueAt : undefined;
    await ctx.db.patch(item._id, {
      name,
      details: details?.trim() || undefined,
      completed,
      category: categoryName,
      dueAt: args.dueAt,
      dueAllDay: args.dueAllDay,
      assigneeId: args.assigneeId,
      priority: args.priority,
      recurrence: args.recurrence,
      reminderSentForDueAt,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    // Notify a newly-assigned teammate (never yourself).
    if (
      args.assigneeId !== undefined &&
      args.assigneeId !== item.assigneeId &&
      args.assigneeId !== userId
    ) {
      await ctx.scheduler.runAfter(0, internal.push.sendToUsers, {
        userIds: [args.assigneeId],
        projectId: list.projectId,
        bodyKey: "task_assigned",
        bodyParams: { name },
        path: `/${list.projectId}/lists/${list._id}`,
      });
    }
    // Only the false->true transition is a meaningful "completed" action; plain
    // edits (renames, re-saves of an already-checked item) shouldn't re-fire it.
    if (!item.completed && completed) {
      await track(ctx, userId, "list_item_completed", {
        projectId: list.projectId,
      });
    } else if (item.completed && !completed) {
      await track(ctx, userId, "list_item_uncompleted", {
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
