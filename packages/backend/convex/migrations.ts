import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * One-off Postgres → Convex migration upserts, driven by scripts/migrate.mjs.
 *
 * These are public (the external migration script calls them via the HTTP
 * client) but gated behind a shared secret: the deployment must have
 * MIGRATION_SECRET set and the caller must pass it. Fail-closed if unset.
 *
 * Every upsert is keyed by `legacyId` (the source Postgres id), so the whole
 * migration is idempotent — re-running patches instead of duplicating. Remove
 * this file, the `legacyId` fields, the `by_legacyId` indexes, and
 * MIGRATION_SECRET after cutover.
 */
function assertSecret(secret: string) {
  const expected = process.env.MIGRATION_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Invalid or missing migration secret");
  }
}

export const upsertUser = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    email: v.string(),
    // Epoch ms the email was verified. REQUIRED for the by-email link to work:
    // Convex Auth only matches an existing user whose `emailVerificationTime` is
    // set (see uniqueUserWithVerifiedEmail), so omitting it would re-create every
    // migrated user as a fresh account, orphaned from their groups.
    emailVerificationTime: v.optional(v.number()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    customImage: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
    dateLocale: v.optional(v.string()),
    locale: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"users">> => {
    assertSecret(secret);
    // Convex Auth lowercases the email before matching on sign-in, so store the
    // normalized form — otherwise a mixed-case address won't link to this row.
    const normalized = { ...data, email: data.email.toLowerCase() };
    const existing = await ctx.db
      .query("users")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", normalized.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, normalized);
      return existing._id;
    }
    // No auth account is created — Convex Auth links to this row by email on the
    // user's first sign-in, so existing logins keep their groups.
    return ctx.db.insert("users", normalized);
  },
});

export const upsertProject = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    createdBy: v.id("users"),
    inviteToken: v.string(),
    inviteTokenExpiresAt: v.optional(v.number()),
    image: v.optional(v.string()),
    color: v.string(),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"projects">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("projects", data);
  },
});

export const addMember = mutation({
  args: {
    secret: v.string(),
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, { secret, projectId, userId }) => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", projectId).eq("userId", userId),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("projectMembers", { projectId, userId });
    }
    return null;
  },
});

export const upsertCategory = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"categories">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("categories", data);
  },
});

export const upsertTemplate = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    // `category` is the category name (the migration script maps the Postgres
    // category id to its name), or null.
    items: v.array(
      v.object({ name: v.string(), category: v.union(v.string(), v.null()) }),
    ),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"listTemplates">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("listTemplates")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("listTemplates", data);
  },
});

export const upsertEvent = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    allDay: v.boolean(),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"events">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("events")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("events", data);
  },
});

export const upsertList = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    favorite: v.boolean(),
    eventId: v.optional(v.id("events")),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"lists">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("lists")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("lists", data);
  },
});

export const upsertItem = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    details: v.optional(v.string()),
    completed: v.boolean(),
    listId: v.id("lists"),
    // Category name (the migration script maps the Postgres category id to
    // its name); absent = no category.
    category: v.optional(v.string()),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"listItems">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("listItems")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      // Also clear the transitional FK on rows migrated before the rework.
      await ctx.db.patch(existing._id, { ...data, categoryId: undefined });
      return existing._id;
    }
    return ctx.db.insert("listItems", data);
  },
});

/** Upload slot for copying file bytes from Uploadthing into Convex storage. */
export const generateUploadUrl = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }): Promise<string> => {
    assertSecret(secret);
    return ctx.storage.generateUploadUrl();
  },
});

export const upsertFile = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    storageId: v.id("_storage"),
    type: v.string(),
    size: v.number(),
    projectId: v.id("projects"),
    eventId: v.optional(v.id("events")),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"files">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("files")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      // Re-run: drop the freshly-uploaded blob and keep the existing row's.
      await ctx.storage.delete(data.storageId);
      await ctx.db.patch(existing._id, {
        ...data,
        storageId: existing.storageId,
      });
      return existing._id;
    }
    return ctx.db.insert("files", data);
  },
});

export const upsertNote = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    contents: v.string(),
    format: v.string(),
    projectId: v.id("projects"),
    eventId: v.optional(v.id("events")),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"notes">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("notes", data);
  },
});

export const upsertPot = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    projectId: v.id("projects"),
    settledAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    eventId: v.optional(v.id("events")),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"pots">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("pots")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("pots", data);
  },
});

export const addPotMember = mutation({
  args: {
    secret: v.string(),
    potId: v.id("pots"),
    userId: v.id("users"),
  },
  handler: async (ctx, { secret, potId, userId }) => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("potMembers")
      .withIndex("by_pot_user", (q) =>
        q.eq("potId", potId).eq("userId", userId),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("potMembers", { potId, userId });
    }
    return null;
  },
});

export const upsertSpending = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.optional(v.string()),
    from: v.optional(v.id("users")),
    to: v.optional(v.id("users")),
    projectId: v.id("projects"),
    potId: v.optional(v.id("pots")),
    createdAt: v.number(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, { secret, ...data }): Promise<Id<"spendings">> => {
    assertSecret(secret);
    const existing = await ctx.db
      .query("spendings")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("spendings", data);
  },
});
