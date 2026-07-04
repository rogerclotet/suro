import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { requireProjectMember } from "./model/permissions";
import { compareTaskItems } from "./model/tasks";

export type TaskWithList = Doc<"listItems"> & { listName: string };

/**
 * The "My tasks" agenda: every incomplete task assigned to `assigneeId`
 * (defaulting to the current user) across the project's task-mode lists, sorted
 * by due date. Grouping into overdue/today/upcoming is left to the client so each
 * surface uses its own local-day boundary. Reads only task-mode lists' items —
 * fine at a group's scale.
 */
export const myTasks = query({
  args: { projectId: v.id("projects"), assigneeId: v.optional(v.id("users")) },
  handler: async (ctx, { projectId, assigneeId }) => {
    const userId = await requireProjectMember(ctx, projectId);
    const target = assigneeId ?? userId;
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const result: TaskWithList[] = [];
    for (const list of lists) {
      if (!list.taskMode) {
        continue;
      }
      const items = await ctx.db
        .query("listItems")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      for (const item of items) {
        if (item.assigneeId === target && !item.completed) {
          result.push({ ...item, listName: list.name });
        }
      }
    }
    result.sort(compareTaskItems);
    return result;
  },
});

// Reminders ------------------------------------------------------------------

/**
 * All-day dues are stored at UTC midnight; firing their reminder at midnight UTC
 * would be the middle of the night for most users, so hold it until this offset
 * into the day. Timed dues remind at their exact instant (the app has no
 * per-user timezone, so a fixed server hour is the best available heuristic).
 */
const ALL_DAY_REMINDER_OFFSET_MS = 9 * 60 * 60 * 1000;

function reminderIsDue(item: Doc<"listItems">, now: number): boolean {
  if (item.dueAt === undefined) {
    return false;
  }
  const threshold = item.dueAllDay
    ? item.dueAt + ALL_DAY_REMINDER_OFFSET_MS
    : item.dueAt;
  return now >= threshold;
}

/**
 * The assigned, incomplete, not-yet-reminded tasks whose due moment has arrived
 * (as of `before`). Range-scans the `by_due` index, which skips items with no
 * due date. Resolves each item's project for the deep-link path.
 */
export const dueRemindersDue = internalQuery({
  args: { before: v.number() },
  handler: async (ctx, { before }) => {
    const candidates = await ctx.db
      .query("listItems")
      .withIndex("by_due", (q) => q.lte("dueAt", before))
      .collect();
    const due: {
      itemId: Doc<"listItems">["_id"];
      assigneeId: Doc<"users">["_id"];
      name: string;
      dueAt: number;
      projectId: Doc<"projects">["_id"];
      listId: Doc<"lists">["_id"];
    }[] = [];
    for (const item of candidates) {
      if (
        item.completed ||
        item.assigneeId === undefined ||
        item.dueAt === undefined ||
        item.reminderSentForDueAt === item.dueAt ||
        !reminderIsDue(item, before)
      ) {
        continue;
      }
      const list = await ctx.db.get(item.listId);
      if (list === null) {
        continue;
      }
      due.push({
        itemId: item._id,
        assigneeId: item.assigneeId,
        name: item.name,
        dueAt: item.dueAt,
        projectId: list.projectId,
        listId: list._id,
      });
    }
    return due;
  },
});

/** Stamp the reminded due moment, skipping any item whose due date has since moved. */
export const markReminded = internalMutation({
  args: {
    items: v.array(v.object({ itemId: v.id("listItems"), dueAt: v.number() })),
  },
  handler: async (ctx, { items }) => {
    for (const { itemId, dueAt } of items) {
      const item = await ctx.db.get(itemId);
      if (item !== null && item.dueAt === dueAt) {
        await ctx.db.patch(itemId, { reminderSentForDueAt: dueAt });
      }
    }
    return null;
  },
});

/** Hourly cron entry point: push a due reminder to each task's assignee, once. */
export const sendDueReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.runQuery(internal.tasks.dueRemindersDue, {
      before: now,
    });
    for (const task of due) {
      await ctx.runAction(internal.push.sendToUsers, {
        userIds: [task.assigneeId],
        projectId: task.projectId,
        bodyKey: "task_due",
        bodyParams: { name: task.name },
        path: `/${task.projectId}/lists/${task.listId}`,
      });
    }
    if (due.length > 0) {
      await ctx.runMutation(internal.tasks.markReminded, {
        items: due.map((task) => ({ itemId: task.itemId, dueAt: task.dueAt })),
      });
    }
    return null;
  },
});
