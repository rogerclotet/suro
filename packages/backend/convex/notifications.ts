import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { requireUserId } from "./model/auth";
import { notificationPath } from "./model/notificationTarget";
import { requireProjectMember } from "./model/permissions";

async function destination(ctx: QueryCtx, row: Doc<"notifications">) {
  const { target, projectId, section } = row;
  const fallback = { kind: "path" as const, path: `/${projectId}/${section}` };
  switch (target.kind) {
    case "calendar": {
      const event = await ctx.db.get(target.eventId);
      return event?.projectId === projectId
        ? { kind: "calendar" as const, startAt: event.startAt }
        : fallback;
    }
    case "lists": {
      const list = await ctx.db.get(target.listId);
      if (list?.projectId !== projectId) return fallback;
      break;
    }
    case "templates": {
      const template = await ctx.db.get(target.templateId);
      if (template?.projectId !== projectId) return fallback;
      break;
    }
    case "notes": {
      const note = await ctx.db.get(target.noteId);
      if (note?.projectId !== projectId) return fallback;
      break;
    }
    case "expenses": {
      const pot = await ctx.db.get(target.potId);
      if (pot?.projectId !== projectId) return fallback;
      break;
    }
    case "files":
    case "members":
      break;
  }
  return { kind: "path" as const, path: notificationPath(projectId, target) };
}

/** One subscription powers the groups list and every section badge. */
export const unread = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const projects = new Set(memberships.map((m) => m.projectId));
    const receipts = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const groups = new Map<
      string,
      { latest: Doc<"notifications">; ids: Doc<"notifications">["_id"][] }
    >();
    for (const row of receipts) {
      if (!projects.has(row.projectId)) continue;
      const key = `${row.projectId}/${row.section}`;
      const group = groups.get(key);
      if (group) group.ids.push(row._id);
      else groups.set(key, { latest: row, ids: [row._id] });
    }
    return Promise.all(
      [...groups.values()].map(async ({ latest, ids }) => ({
        projectId: latest.projectId,
        section: latest.section,
        ids,
        count: ids.length,
        latestId: latest._id,
        destination: await destination(ctx, latest),
      })),
    );
  },
});

/** Delete only the receipts actually observed, preserving updates arriving during a visit. */
export const markRead = mutation({
  args: { projectId: v.id("projects"), ids: v.array(v.id("notifications")) },
  handler: async (ctx, { projectId, ids }) => {
    const userId = await requireProjectMember(ctx, projectId);
    for (const id of new Set(ids)) {
      const receipt = await ctx.db.get(id);
      if (!receipt) continue;
      if (receipt.userId !== userId || receipt.projectId !== projectId) {
        throw new Error("Notification does not belong to this user and group");
      }
      await ctx.db.delete(id);
    }
  },
});
