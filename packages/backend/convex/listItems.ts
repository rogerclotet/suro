import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation } from "./_generated/server";
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
  type Recurrence,
  recurrenceValidator,
} from "./model/tasks";

/**
 * A recurring task that's being checked off doesn't complete — it advances to
 * its next occurrence and stays open. Returns the completion/due fields to
 * patch, or null when the plain `completed` flag applies.
 *
 * The caller supplies the recurrence and due date rather than reading them off
 * `item`, because the two callers disagree on purpose: `update` keys off the
 * *incoming* values, so clearing the repeat in the same edit lets the task
 * complete normally, while `setCompleted` carries no edits and keys off the
 * stored ones.
 */
function rescheduleFields(
  item: Doc<"listItems">,
  completed: boolean,
  recurrence: Recurrence | undefined,
  dueAt: number | undefined,
  now: number,
) {
  if (recurrence === undefined || !completed || item.completed) {
    return null;
  }
  return {
    completed: false,
    dueAt: advanceDueAt(dueAt ?? now, recurrence, now),
    // The next occurrence is a new due moment, so re-arm the reminder.
    reminderSentForDueAt: undefined,
  } as const;
}

/**
 * Record what a completion change meant. Only the false->true transition is a
 * meaningful "completed" action; plain edits (renames, re-saves of an
 * already-checked item) shouldn't re-fire it.
 */
async function trackCompletion(
  ctx: MutationCtx,
  userId: Id<"users">,
  projectId: Id<"projects">,
  item: Doc<"listItems">,
  completed: boolean,
  rescheduled: boolean,
): Promise<void> {
  if (rescheduled) {
    await track(ctx, userId, "task_rescheduled", { projectId });
    return;
  }
  if (!item.completed && completed) {
    await track(ctx, userId, "list_item_completed", { projectId });
  } else if (item.completed && !completed) {
    await track(ctx, userId, "list_item_uncompleted", { projectId });
  }
}

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

    const now = Date.now();
    const reschedule = rescheduleFields(
      item,
      completed,
      args.recurrence,
      args.dueAt,
      now,
    );
    if (reschedule !== null) {
      await ctx.db.patch(item._id, {
        name,
        details: details?.trim() || undefined,
        category: categoryName,
        dueAllDay: args.dueAllDay,
        assigneeId: args.assigneeId,
        priority: args.priority,
        recurrence: args.recurrence,
        ...reschedule,
        updatedBy: userId,
        updatedAt: now,
      });
      await trackCompletion(ctx, userId, list.projectId, item, completed, true);
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
      updatedAt: now,
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
    await trackCompletion(ctx, userId, list.projectId, item, completed, false);
    return null;
  },
});

/**
 * Tick an item off (or back on) without touching anything else.
 *
 * `update` is deliberately non-sticky — it wipes any task field the caller
 * omits (see the `itemTaskArgs` note in the mobile checklist) — which makes it a
 * trap for thin clients that only want to flip a checkbox. The Wear OS app uses
 * this instead; a watch has no business round-tripping due dates and assignees
 * it never showed. Recurring tasks still advance rather than complete, exactly
 * as they do through `update`.
 */
export const setCompleted = mutation({
  args: { itemId: v.id("listItems"), completed: v.boolean() },
  handler: async (ctx, { itemId, completed }) => {
    const { item, list, userId } = await requireItemAccess(ctx, itemId);
    const now = Date.now();
    const reschedule = rescheduleFields(
      item,
      completed,
      item.recurrence,
      item.dueAt,
      now,
    );
    await ctx.db.patch(item._id, {
      ...(reschedule ?? { completed }),
      updatedBy: userId,
      updatedAt: now,
    });
    await trackCompletion(
      ctx,
      userId,
      list.projectId,
      item,
      completed,
      reschedule !== null,
    );
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
