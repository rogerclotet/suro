import { ConvexError, v } from "convex/values";
import {
  drawAssignments,
  exclusionError,
  hasValidDraw,
  MIN_PARTICIPANTS,
  parseGiftUrl,
  priceRangeIsValid,
  pruneExclusions,
  sameExclusion,
} from "domain/secret-santa";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { track } from "./model/analytics";
import { notifyUsers } from "./model/notify";
import {
  assertProjectMembership,
  requireProjectMember,
} from "./model/permissions";
import { recordProjectActivity } from "./model/projectActivity";
import {
  canOrganize,
  deleteGiftIdeas,
  exchangeEventEnd,
  findActiveSecretSanta,
  participantRows,
  requireOrganizer,
  requireSecretSantaAccess,
  syncLinkedEvent,
} from "./model/secretSantas";

const priceRange = v.object({ min: v.number(), max: v.number() });

const details = {
  name: v.string(),
  description: v.optional(v.string()),
  exchangeAt: v.number(),
  exchangeAllDay: v.boolean(),
  priceRange,
  participantIds: v.array(v.id("users")),
};

async function person(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  return {
    userId,
    name: user?.name ?? null,
    image: user?.customImage ?? user?.image ?? null,
    avatarColor: user?.avatarColor ?? null,
  };
}

function giftIdeaView(idea: Doc<"secretSantaGiftIdeas">) {
  return {
    _id: idea._id,
    name: idea.name,
    description: idea.description ?? null,
    url: idea.url ?? null,
  };
}

async function giftIdeasOf(
  ctx: QueryCtx,
  secretSantaId: Id<"secretSantas">,
  userId: Id<"users">,
) {
  const ideas = await ctx.db
    .query("secretSantaGiftIdeas")
    .withIndex("by_secretSanta_user", (q) =>
      q.eq("secretSantaId", secretSantaId).eq("userId", userId),
    )
    .collect();
  return ideas.map(giftIdeaView);
}

/**
 * The group's active Secret Santa, or null. Every member sees its details and
 * participants; only the caller's own assignment and their receiver's ideas
 * are included, never anyone else's.
 */
export const current = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await requireProjectMember(ctx, projectId);
    const secretSanta = await findActiveSecretSanta(ctx, projectId);
    if (secretSanta === null) return null;
    const rows = await participantRows(ctx, secretSanta._id);
    const participants = await Promise.all(
      rows.map((row) => person(ctx, row.userId)),
    );
    participants.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    const mine = rows.find((row) => row.userId === userId);
    const assignedTo = mine?.assignedTo;
    const assignment =
      assignedTo === undefined
        ? null
        : {
            ...(await person(ctx, assignedTo)),
            giftIdeas: await giftIdeasOf(ctx, secretSanta._id, assignedTo),
          };
    const organizer = await person(ctx, secretSanta.createdBy);
    return {
      _id: secretSanta._id,
      projectId: secretSanta.projectId,
      name: secretSanta.name,
      description: secretSanta.description ?? null,
      exchangeAt: secretSanta.exchangeAt,
      exchangeAllDay: secretSanta.exchangeAllDay ?? false,
      priceRange: secretSanta.priceRange,
      exclusions: secretSanta.exclusions,
      eventId: secretSanta.eventId ?? null,
      drawnAt: secretSanta.drawnAt ?? null,
      organizerName: organizer.name,
      canOrganize: await canOrganize(ctx, secretSanta, userId),
      isParticipant: mine !== undefined,
      participants,
      assignment,
    };
  },
});

/** The caller's own gift ideas; empty once the Secret Santa is gone. */
export const myGiftIdeas = query({
  args: { secretSantaId: v.id("secretSantas") },
  handler: async (ctx, { secretSantaId }) => {
    const secretSanta = await ctx.db.get(secretSantaId);
    if (secretSanta === null) return [];
    const userId = await requireProjectMember(ctx, secretSanta.projectId);
    return giftIdeasOf(ctx, secretSantaId, userId);
  },
});

function requireName(name: string) {
  const trimmed = name.trim();
  if (trimmed === "") {
    throw new Error("Secret Santa name is required");
  }
  return trimmed;
}

function requirePriceRange(range: { min: number; max: number }) {
  if (!priceRangeIsValid(range)) {
    throw new Error("Invalid price range");
  }
  return range;
}

/**
 * Deduplicate the participants and check that newcomers belong to the group.
 * Existing participants are not rechecked: someone who left after the draw
 * still takes part in it.
 */
async function requireParticipants(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  participantIds: Id<"users">[],
  existing: Id<"users">[] = [],
) {
  const unique = [...new Set(participantIds)];
  if (unique.length < MIN_PARTICIPANTS) {
    throw new ConvexError({
      code: "TOO_FEW_PARTICIPANTS",
      message: "At least two participants are required",
    });
  }
  for (const userId of unique) {
    if (!existing.includes(userId)) {
      await assertProjectMembership(ctx, projectId, userId);
    }
  }
  return unique;
}

export const create = mutation({
  args: { projectId: v.id("projects"), ...details },
  handler: async (ctx, args) => {
    const userId = await requireProjectMember(ctx, args.projectId);
    if ((await findActiveSecretSanta(ctx, args.projectId)) !== null) {
      throw new ConvexError({
        code: "ACTIVE_SECRET_SANTA_EXISTS",
        message: "This group already has an active Secret Santa",
      });
    }
    const name = requireName(args.name);
    const description = args.description?.trim() || undefined;
    const participantIds = await requireParticipants(
      ctx,
      args.projectId,
      args.participantIds,
    );
    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      name,
      description,
      startAt: args.exchangeAt,
      endAt: exchangeEventEnd(args.exchangeAt, args.exchangeAllDay),
      allDay: args.exchangeAllDay,
      projectId: args.projectId,
      createdBy: userId,
      updatedAt: now,
    });
    const secretSantaId = await ctx.db.insert("secretSantas", {
      projectId: args.projectId,
      name,
      description,
      exchangeAt: args.exchangeAt,
      exchangeAllDay: args.exchangeAllDay,
      priceRange: requirePriceRange(args.priceRange),
      exclusions: [],
      eventId,
      createdBy: userId,
      updatedAt: now,
    });
    for (const participantId of participantIds) {
      await ctx.db.insert("secretSantaParticipants", {
        secretSantaId,
        projectId: args.projectId,
        userId: participantId,
      });
    }
    await notifyUsers(ctx, {
      projectId: args.projectId,
      userIds: participantIds.filter((id) => id !== userId),
      bodyKey: "secret_santa_created",
      bodyParams: { name },
      target: { kind: "secretSanta", secretSantaId },
    });
    await track(ctx, userId, "secret_santa_created", {
      projectId: args.projectId,
      participantCount: participantIds.length,
      allDay: args.exchangeAllDay,
    });
    return secretSantaId;
  },
});

/**
 * Edit the details. Participants can change only before the draw; afterwards
 * the same participants must be sent back.
 */
export const update = mutation({
  args: { secretSantaId: v.id("secretSantas"), ...details },
  handler: async (ctx, args) => {
    const { secretSanta, userId } = await requireOrganizer(
      ctx,
      args.secretSantaId,
    );
    const name = requireName(args.name);
    const rows = await participantRows(ctx, secretSanta._id);
    const current = rows.map((row) => row.userId);
    const participantIds = await requireParticipants(
      ctx,
      secretSanta.projectId,
      args.participantIds,
      current,
    );
    const added = participantIds.filter((id) => !current.includes(id));
    const removed = rows.filter((row) => !participantIds.includes(row.userId));
    if (
      secretSanta.drawnAt !== undefined &&
      (added.length > 0 || removed.length > 0)
    ) {
      throw new ConvexError({
        code: "PARTICIPANTS_LOCKED",
        message: "Participants cannot change after the draw",
      });
    }
    for (const row of removed) {
      await deleteGiftIdeas(ctx, secretSanta._id, row.userId);
      await ctx.db.delete(row._id);
    }
    for (const participantId of added) {
      await ctx.db.insert("secretSantaParticipants", {
        secretSantaId: secretSanta._id,
        projectId: secretSanta.projectId,
        userId: participantId,
      });
    }
    const patch = {
      name,
      description: args.description?.trim() || undefined,
      exchangeAt: args.exchangeAt,
      exchangeAllDay: args.exchangeAllDay,
      priceRange: requirePriceRange(args.priceRange),
      exclusions: pruneExclusions(secretSanta.exclusions, participantIds),
      updatedBy: userId,
      updatedAt: Date.now(),
    };
    await ctx.db.patch(secretSanta._id, patch);
    await syncLinkedEvent(ctx, { ...secretSanta, ...patch }, userId);
    await notifyUsers(ctx, {
      projectId: secretSanta.projectId,
      userIds: added.filter((id) => id !== userId),
      bodyKey: "secret_santa_created",
      bodyParams: { name },
      target: { kind: "secretSanta", secretSantaId: secretSanta._id },
    });
    return null;
  },
});

/** Close the Secret Santa so the group can start a new one. Its event stays. */
export const archive = mutation({
  args: { secretSantaId: v.id("secretSantas") },
  handler: async (ctx, { secretSantaId }) => {
    const { secretSanta, userId } = await requireOrganizer(ctx, secretSantaId);
    await ctx.db.patch(secretSanta._id, {
      archivedAt: Date.now(),
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    await track(ctx, userId, "secret_santa_archived", {
      projectId: secretSanta.projectId,
      drawn: secretSanta.drawnAt !== undefined,
    });
    await recordProjectActivity(ctx, secretSanta.projectId);
    return null;
  },
});

async function requirePendingDraw(
  ctx: QueryCtx,
  secretSantaId: Id<"secretSantas">,
) {
  const access = await requireOrganizer(ctx, secretSantaId);
  if (access.secretSanta.drawnAt !== undefined) {
    throw new ConvexError({
      code: "ALREADY_DRAWN",
      message: "The draw has already been done",
    });
  }
  return access;
}

/**
 * Add a group of participants who must not draw each other. Rejected when it
 * would leave no possible draw, so the organizer learns it before drawing.
 */
export const addExclusion = mutation({
  args: {
    secretSantaId: v.id("secretSantas"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, { secretSantaId, userIds }) => {
    const { secretSanta, userId } = await requirePendingDraw(
      ctx,
      secretSantaId,
    );
    const participants = (await participantRows(ctx, secretSanta._id)).map(
      (row) => row.userId,
    );
    const error = exclusionError(userIds, participants, secretSanta.exclusions);
    if (error !== null) {
      throw new ConvexError({
        code: "INVALID_EXCLUSION",
        reason: error,
        message: `Invalid exclusion: ${error}`,
      });
    }
    const exclusions = [...secretSanta.exclusions, userIds];
    if (!hasValidDraw(participants, exclusions)) {
      throw new ConvexError({
        code: "NO_VALID_ASSIGNMENTS",
        message: "This exclusion would make the draw impossible",
      });
    }
    await ctx.db.patch(secretSanta._id, {
      exclusions,
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    await recordProjectActivity(ctx, secretSanta.projectId);
    return null;
  },
});

export const removeExclusion = mutation({
  args: {
    secretSantaId: v.id("secretSantas"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, { secretSantaId, userIds }) => {
    const { secretSanta, userId } = await requirePendingDraw(
      ctx,
      secretSantaId,
    );
    await ctx.db.patch(secretSanta._id, {
      exclusions: secretSanta.exclusions.filter(
        (group) => !sameExclusion(group, userIds),
      ),
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    await recordProjectActivity(ctx, secretSanta.projectId);
    return null;
  },
});

/** Assign everyone a receiver. Final: participants are fixed afterwards. */
export const draw = mutation({
  args: { secretSantaId: v.id("secretSantas") },
  handler: async (ctx, { secretSantaId }) => {
    const { secretSanta, userId } = await requirePendingDraw(
      ctx,
      secretSantaId,
    );
    const rows = await participantRows(ctx, secretSanta._id);
    const assignments = drawAssignments(
      rows.map((row) => row.userId),
      secretSanta.exclusions,
    );
    if (assignments === null) {
      throw new ConvexError({
        code: "NO_VALID_ASSIGNMENTS",
        message: "No draw satisfies the exclusions",
      });
    }
    for (const row of rows) {
      await ctx.db.patch(row._id, { assignedTo: assignments.get(row.userId) });
    }
    await ctx.db.patch(secretSanta._id, {
      drawnAt: Date.now(),
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    await notifyUsers(ctx, {
      projectId: secretSanta.projectId,
      userIds: rows.map((row) => row.userId).filter((id) => id !== userId),
      bodyKey: "secret_santa_started",
      bodyParams: { name: secretSanta.name },
      target: { kind: "secretSanta", secretSantaId: secretSanta._id },
    });
    await track(ctx, userId, "secret_santa_drawn", {
      projectId: secretSanta.projectId,
      participantCount: rows.length,
      exclusionCount: secretSanta.exclusions.length,
    });
    return null;
  },
});

const giftIdea = {
  name: v.string(),
  description: v.optional(v.string()),
  url: v.optional(v.string()),
};

function giftIdeaFields(args: {
  name: string;
  description?: string;
  url?: string;
}) {
  const name = args.name.trim();
  if (name === "") {
    throw new Error("Gift idea name is required");
  }
  const url = parseGiftUrl(args.url ?? "");
  if (!url.valid) {
    throw new ConvexError({ code: "INVALID_URL", message: "Invalid link" });
  }
  return {
    name,
    description: args.description?.trim() || undefined,
    url: url.url,
    updatedAt: Date.now(),
  };
}

async function requireParticipant(
  ctx: QueryCtx,
  secretSantaId: Id<"secretSantas">,
) {
  const { secretSanta, userId } = await requireSecretSantaAccess(
    ctx,
    secretSantaId,
  );
  if (secretSanta.archivedAt !== undefined) {
    throw new ConvexError({
      code: "ARCHIVED",
      message: "Secret Santa is archived",
    });
  }
  const row = await ctx.db
    .query("secretSantaParticipants")
    .withIndex("by_secretSanta_user", (q) =>
      q.eq("secretSantaId", secretSantaId).eq("userId", userId),
    )
    .unique();
  if (row === null) {
    throw new Error("Only participants can add gift ideas");
  }
  return { secretSanta, userId };
}

async function requireOwnGiftIdea(
  ctx: QueryCtx,
  giftIdeaId: Id<"secretSantaGiftIdeas">,
) {
  const idea = await ctx.db.get(giftIdeaId);
  if (idea === null) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Gift idea not found",
    });
  }
  const { secretSanta, userId } = await requireParticipant(
    ctx,
    idea.secretSantaId,
  );
  if (idea.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Gift idea not found",
    });
  }
  return { idea, secretSanta, userId };
}

export const createGiftIdea = mutation({
  args: { secretSantaId: v.id("secretSantas"), ...giftIdea },
  handler: async (ctx, { secretSantaId, ...fields }) => {
    const { secretSanta, userId } = await requireParticipant(
      ctx,
      secretSantaId,
    );
    const giftIdeaId = await ctx.db.insert("secretSantaGiftIdeas", {
      secretSantaId,
      projectId: secretSanta.projectId,
      userId,
      ...giftIdeaFields(fields),
    });
    await track(ctx, userId, "secret_santa_gift_idea_created", {
      projectId: secretSanta.projectId,
      hasLink: fields.url !== undefined && fields.url.trim() !== "",
    });
    await recordProjectActivity(ctx, secretSanta.projectId);
    return giftIdeaId;
  },
});

export const updateGiftIdea = mutation({
  args: { giftIdeaId: v.id("secretSantaGiftIdeas"), ...giftIdea },
  handler: async (ctx, { giftIdeaId, ...fields }) => {
    const { idea, secretSanta } = await requireOwnGiftIdea(ctx, giftIdeaId);
    await ctx.db.patch(idea._id, giftIdeaFields(fields));
    await recordProjectActivity(ctx, secretSanta.projectId);
    return null;
  },
});

export const removeGiftIdea = mutation({
  args: { giftIdeaId: v.id("secretSantaGiftIdeas") },
  handler: async (ctx, { giftIdeaId }) => {
    const { idea, secretSanta } = await requireOwnGiftIdea(ctx, giftIdeaId);
    await ctx.db.delete(idea._id);
    await recordProjectActivity(ctx, secretSanta.projectId);
    return null;
  },
});
