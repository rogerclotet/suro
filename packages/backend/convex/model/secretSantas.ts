import { ConvexError } from "convex/values";
import { DAY_MS, HOUR_MS } from "domain/events";
import { pruneExclusions } from "domain/secret-santa";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireProjectMember } from "./permissions";

/** The project's Secret Santa that is not archived, if any. */
export async function findActiveSecretSanta(
  ctx: QueryCtx,
  projectId: Id<"projects">,
) {
  const rows = await ctx.db
    .query("secretSantas")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  return rows.find((row) => row.archivedAt === undefined) ?? null;
}

export async function requireSecretSantaAccess(
  ctx: QueryCtx,
  secretSantaId: Id<"secretSantas">,
) {
  const secretSanta = await ctx.db.get(secretSantaId);
  if (secretSanta === null) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Secret Santa not found",
    });
  }
  const userId = await requireProjectMember(ctx, secretSanta.projectId);
  return { secretSanta, userId };
}

/** The creator organizes; the group admin can step in if they leave. */
export async function canOrganize(
  ctx: QueryCtx,
  secretSanta: Doc<"secretSantas">,
  userId: Id<"users">,
) {
  if (secretSanta.createdBy === userId) return true;
  const project = await ctx.db.get(secretSanta.projectId);
  return project?.createdBy === userId;
}

/** Organizer access to a Secret Santa that is still active. */
export async function requireOrganizer(
  ctx: QueryCtx,
  secretSantaId: Id<"secretSantas">,
) {
  const { secretSanta, userId } = await requireSecretSantaAccess(
    ctx,
    secretSantaId,
  );
  if (!(await canOrganize(ctx, secretSanta, userId))) {
    throw new Error("Only the organizer can manage this Secret Santa");
  }
  if (secretSanta.archivedAt !== undefined) {
    throw new ConvexError({
      code: "ARCHIVED",
      message: "Secret Santa is archived",
    });
  }
  return { secretSanta, userId };
}

export async function participantRows(
  ctx: QueryCtx,
  secretSantaId: Id<"secretSantas">,
) {
  return ctx.db
    .query("secretSantaParticipants")
    .withIndex("by_secretSanta", (q) => q.eq("secretSantaId", secretSantaId))
    .collect();
}

export async function deleteGiftIdeas(
  ctx: MutationCtx,
  secretSantaId: Id<"secretSantas">,
  userId: Id<"users">,
) {
  const ideas = await ctx.db
    .query("secretSantaGiftIdeas")
    .withIndex("by_secretSanta_user", (q) =>
      q.eq("secretSantaId", secretSantaId).eq("userId", userId),
    )
    .collect();
  for (const idea of ideas) await ctx.db.delete(idea._id);
}

/** Exclusive end for the linked event: one day, or a one-hour slot. */
export function exchangeEventEnd(exchangeAt: number, allDay: boolean) {
  return exchangeAt + (allDay ? DAY_MS : HOUR_MS);
}

/** Mirror the Secret Santa's name, description and time onto its event. */
export async function syncLinkedEvent(
  ctx: MutationCtx,
  secretSanta: Doc<"secretSantas">,
  userId: Id<"users">,
) {
  if (secretSanta.eventId === undefined) return;
  const event = await ctx.db.get(secretSanta.eventId);
  if (event === null) return;
  const allDay = secretSanta.exchangeAllDay ?? false;
  // Keep a duration someone set in the calendar unless the kind changed.
  const endAt =
    event.allDay === allDay
      ? secretSanta.exchangeAt + (event.endAt - event.startAt)
      : exchangeEventEnd(secretSanta.exchangeAt, allDay);
  await ctx.db.patch(event._id, {
    name: secretSanta.name,
    description: secretSanta.description,
    startAt: secretSanta.exchangeAt,
    endAt,
    allDay,
    updatedBy: userId,
    updatedAt: Date.now(),
  });
}

/** Mirror a calendar edit of the linked event back onto its Secret Santa. */
export async function syncFromLinkedEvent(
  ctx: MutationCtx,
  event: Doc<"events">,
  userId: Id<"users">,
) {
  const linked = await ctx.db
    .query("secretSantas")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const secretSanta of linked) {
    await ctx.db.patch(secretSanta._id, {
      name: event.name,
      description: event.description,
      exchangeAt: event.startAt,
      exchangeAllDay: event.allDay,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
  }
}

export async function unlinkEvent(ctx: MutationCtx, eventId: Id<"events">) {
  const linked = await ctx.db
    .query("secretSantas")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  for (const secretSanta of linked) {
    await ctx.db.patch(secretSanta._id, { eventId: undefined });
  }
}

/**
 * Remove someone leaving the group from every draw that has not happened yet,
 * with their wishes and exclusions. A completed draw keeps them, since another
 * participant may already be preparing their gift.
 */
export async function withdrawFromPendingDraws(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
) {
  const rows = await ctx.db
    .query("secretSantaParticipants")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId),
    )
    .collect();
  for (const row of rows) {
    const secretSanta = await ctx.db.get(row.secretSantaId);
    if (
      !secretSanta ||
      secretSanta.drawnAt !== undefined ||
      secretSanta.archivedAt !== undefined
    ) {
      continue;
    }
    await withdrawParticipant(ctx, secretSanta, row);
  }
}

/** Delete a participant before the draw, pruning exclusions that named them. */
export async function withdrawParticipant(
  ctx: MutationCtx,
  secretSanta: Doc<"secretSantas">,
  row: Doc<"secretSantaParticipants">,
) {
  await deleteGiftIdeas(ctx, secretSanta._id, row.userId);
  await ctx.db.delete(row._id);
  const remaining = (await participantRows(ctx, secretSanta._id)).map(
    (participant) => participant.userId,
  );
  await ctx.db.patch(secretSanta._id, {
    exclusions: pruneExclusions(secretSanta.exclusions, remaining),
  });
}

/** Erase a deleted account's participation and wishes everywhere. */
export async function deleteUserSecretSantaData(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const rows = await ctx.db
    .query("secretSantaParticipants")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const row of rows) {
    const secretSanta = await ctx.db.get(row.secretSantaId);
    if (secretSanta && secretSanta.drawnAt === undefined) {
      await withdrawParticipant(ctx, secretSanta, row);
    } else {
      await ctx.db.delete(row._id);
    }
  }
  const ideas = await ctx.db
    .query("secretSantaGiftIdeas")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const idea of ideas) await ctx.db.delete(idea._id);
}
