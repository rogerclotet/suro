import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";
import { loadListWithItems } from "./model/lists";
import {
  requireEventAccess,
  requireListAccess,
  requireNoteAccess,
  requirePotAccess,
  requireProjectMember,
} from "./model/permissions";

/** Adds a UTC day to an all-day event's end so the half-open range still
 * overlaps the final day — mirrors the Drizzle app's createEvent/editEvent. */
const DAY_MS = 86_400_000;
function normalizeEnd(endAt: number, allDay: boolean): number {
  return allDay ? endAt + DAY_MS : endAt;
}

export const listByRange = query({
  args: {
    projectId: v.id("projects"),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, { projectId, from, to }) => {
    await requireProjectMember(ctx, projectId);
    // Bound the scan by startAt <= window end, then keep events whose end is at
    // or after the window start (overlap test, like the Postgres query).
    const candidates = await ctx.db
      .query("events")
      .withIndex("by_project_start", (q) =>
        q.eq("projectId", projectId).lte("startAt", to),
      )
      .collect();
    return candidates
      .filter((event) => event.endAt >= from)
      .sort((a, b) => a.startAt - b.startAt);
  },
});

/** The event plus its linked list, note, and expense pot — each or null. */
export const get = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    const [linkedList, linkedNote, linkedPot] = await Promise.all([
      ctx.db
        .query("lists")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .first(),
      ctx.db
        .query("notes")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .first(),
      ctx.db
        .query("pots")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .first(),
    ]);
    // The pot card only needs a member count, not the full balances payload.
    let pot = null;
    if (linkedPot) {
      const members = await ctx.db
        .query("potMembers")
        .withIndex("by_pot", (q) => q.eq("potId", linkedPot._id))
        .collect();
      pot = { ...linkedPot, memberCount: members.length };
    }
    return {
      ...event,
      list: linkedList ? await loadListWithItems(ctx, linkedList) : null,
      note: linkedNote,
      pot,
    };
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    allDay: v.boolean(),
  },
  handler: async (
    ctx,
    { projectId, name, description, startAt, endAt, allDay },
  ) => {
    const userId = await requireProjectMember(ctx, projectId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Event name is required");
    }
    const eventId = await ctx.db.insert("events", {
      name: trimmed,
      description: (description ?? "").trim() || undefined,
      startAt,
      endAt: normalizeEnd(endAt, allDay),
      allDay,
      projectId,
      createdBy: userId,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId,
      actorId: userId,
      bodyKey: "event_created",
      bodyParams: { name: trimmed },
      path: `/${projectId}/calendar`,
    });
    return eventId;
  },
});

export const update = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    allDay: v.boolean(),
  },
  handler: async (
    ctx,
    { eventId, name, description, startAt, endAt, allDay },
  ) => {
    const { event, userId } = await requireEventAccess(ctx, eventId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Event name is required");
    }
    // Unlike the Drizzle editEvent (which never wrote allDay — a latent bug),
    // we persist allDay so the stored flag and the times stay consistent.
    await ctx.db.patch(event._id, {
      name: trimmed,
      description: (description ?? "").trim() || undefined,
      startAt,
      endAt: normalizeEnd(endAt, allDay),
      allDay,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    // Mirror ON DELETE SET NULL for the things that point at this event:
    // unlink any linked lists and detach any attached files (they survive).
    const linkedLists = await ctx.db
      .query("lists")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const list of linkedLists) {
      await ctx.db.patch(list._id, { eventId: undefined });
    }
    const attachedFiles = await ctx.db
      .query("files")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const file of attachedFiles) {
      await ctx.db.patch(file._id, { eventId: undefined });
    }
    const linkedNotes = await ctx.db
      .query("notes")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const note of linkedNotes) {
      await ctx.db.patch(note._id, { eventId: undefined });
    }
    const linkedPots = await ctx.db
      .query("pots")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const pot of linkedPots) {
      await ctx.db.patch(pot._id, { eventId: undefined });
    }
    await ctx.db.delete(event._id);
    return null;
  },
});

/** Create a fresh list already linked to the event (ports createLinkedList). */
export const createLinkedList = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event, userId } = await requireEventAccess(ctx, eventId);
    return ctx.db.insert("lists", {
      name: event.name,
      description: `List for ${event.name}`,
      projectId: event.projectId,
      favorite: false,
      eventId: event._id,
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});

/** Link an existing list (same project) to the event (ports linkEventList). */
export const linkList = mutation({
  args: { eventId: v.id("events"), listId: v.id("lists") },
  handler: async (ctx, { eventId, listId }) => {
    const { event, userId } = await requireEventAccess(ctx, eventId);
    const { list } = await requireListAccess(ctx, listId);
    if (list.projectId !== event.projectId) {
      throw new Error("List and event are not in the same project");
    }
    await ctx.db.patch(list._id, { eventId: event._id, updatedBy: userId });
    return null;
  },
});

export const unlinkList = mutation({
  args: { eventId: v.id("events"), listId: v.id("lists") },
  handler: async (ctx, { eventId, listId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    const { list } = await requireListAccess(ctx, listId);
    if (list.eventId !== event._id) {
      throw new Error("List is not linked to the event");
    }
    await ctx.db.patch(list._id, { eventId: undefined });
    return null;
  },
});

/** Create a blank note already linked to the event (mirrors createLinkedList). */
export const createLinkedNote = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const { event, userId } = await requireEventAccess(ctx, eventId);
    return ctx.db.insert("notes", {
      name: event.name,
      contents: "",
      format: "html",
      projectId: event.projectId,
      eventId: event._id,
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});

export const linkNote = mutation({
  args: { eventId: v.id("events"), noteId: v.id("notes") },
  handler: async (ctx, { eventId, noteId }) => {
    const { event, userId } = await requireEventAccess(ctx, eventId);
    const { note } = await requireNoteAccess(ctx, noteId);
    if (note.projectId !== event.projectId) {
      throw new Error("Note and event are not in the same project");
    }
    await ctx.db.patch(note._id, { eventId: event._id, updatedBy: userId });
    return null;
  },
});

export const unlinkNote = mutation({
  args: { eventId: v.id("events"), noteId: v.id("notes") },
  handler: async (ctx, { eventId, noteId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    const { note } = await requireNoteAccess(ctx, noteId);
    if (note.eventId !== event._id) {
      throw new Error("Note is not linked to the event");
    }
    await ctx.db.patch(note._id, { eventId: undefined });
    return null;
  },
});

/**
 * Create an expense pot already linked to the event. Pass `memberIds` to choose
 * who's in it; omit it to seed with every project member (the default). A pot
 * needs at least two — expenses are inherently a group feature.
 */
export const createLinkedPot = mutation({
  args: {
    eventId: v.id("events"),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, { eventId, memberIds }) => {
    const { event, userId } = await requireEventAccess(ctx, eventId);

    let resolved: Id<"users">[];
    if (memberIds === undefined) {
      const members = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", event.projectId))
        .collect();
      resolved = [...new Set(members.map((m) => m.userId))];
    } else {
      // De-dupe and require every chosen member to belong to the group.
      resolved = [...new Set(memberIds)];
      for (const memberId of resolved) {
        const membership = await ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) =>
            q.eq("projectId", event.projectId).eq("userId", memberId),
          )
          .unique();
        if (membership === null) {
          throw new Error("Member is not in this group");
        }
      }
    }
    if (resolved.length < 2) {
      throw new Error("A pot needs at least two members");
    }

    const potId = await ctx.db.insert("pots", {
      name: event.name,
      projectId: event.projectId,
      eventId: event._id,
      createdBy: userId,
    });
    for (const memberId of resolved) {
      await ctx.db.insert("potMembers", { potId, userId: memberId });
    }
    return potId;
  },
});

export const linkPot = mutation({
  args: { eventId: v.id("events"), potId: v.id("pots") },
  handler: async (ctx, { eventId, potId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    const { pot } = await requirePotAccess(ctx, potId);
    if (pot.projectId !== event.projectId) {
      throw new Error("Pot and event are not in the same project");
    }
    await ctx.db.patch(pot._id, { eventId: event._id });
    return null;
  },
});

export const unlinkPot = mutation({
  args: { eventId: v.id("events"), potId: v.id("pots") },
  handler: async (ctx, { eventId, potId }) => {
    const { event } = await requireEventAccess(ctx, eventId);
    const { pot } = await requirePotAccess(ctx, potId);
    if (pot.eventId !== event._id) {
      throw new Error("Pot is not linked to the event");
    }
    await ctx.db.patch(pot._id, { eventId: undefined });
    return null;
  },
});

/**
 * Return (lazily creating) the project's secret calendar-feed token. The token
 * gates the public `.ics` HTTP endpoint — distinct from inviteToken. Idempotent.
 */
export const getOrCreateCalendarToken = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    const project = await ctx.db.get(projectId);
    if (project === null) {
      throw new Error("Project not found");
    }
    if (project.calendarToken) {
      return project.calendarToken;
    }
    const token = crypto.randomUUID().replace(/-/g, "");
    await ctx.db.patch(projectId, { calendarToken: token });
    return token;
  },
});

/**
 * Token-gated data for the `.ics` feed (internal — only the http.ts route calls
 * this, with the secret token as the gate; no session auth). Returns null for a
 * missing/mismatched token. Events, organizer-per-event, and member attendees
 * mirror the PWA's getEventsToExport.
 */
export const exportData = internalQuery({
  args: { projectId: v.id("projects"), token: v.string() },
  handler: async (ctx, { projectId, token }) => {
    if (token === "") {
      return null;
    }
    const project = await ctx.db
      .query("projects")
      .withIndex("by_calendarToken", (q) => q.eq("calendarToken", token))
      .unique();
    if (project === null || project._id !== projectId) {
      return null;
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const userCache = new Map<Id<"users">, Doc<"users"> | null>();
    async function loadUser(id: Id<"users">) {
      if (!userCache.has(id)) {
        userCache.set(id, await ctx.db.get(id));
      }
      return userCache.get(id) ?? null;
    }

    const organizers: {
      eventId: Id<"events">;
      name?: string;
      email: string;
    }[] = [];
    for (const event of events) {
      const creator = await loadUser(event.createdBy);
      if (creator?.email) {
        organizers.push({
          eventId: event._id,
          name: creator.name,
          email: creator.email,
        });
      }
    }

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const attendees: { name?: string; email: string }[] = [];
    for (const member of members) {
      const user = await loadUser(member.userId);
      if (user?.email) {
        attendees.push({ name: user.name, email: user.email });
      }
    }

    return { calendarName: project.name, events, organizers, attendees };
  },
});
