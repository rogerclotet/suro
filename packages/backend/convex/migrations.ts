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
    const existing = await ctx.db
      .query("users")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", data.legacyId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    // No auth account is created — Convex Auth links to this row by email on the
    // user's first sign-in, so existing logins keep their groups.
    return ctx.db.insert("users", data);
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
    features: v.object({ secretSanta: v.boolean() }),
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

export const upsertList = mutation({
  args: {
    secret: v.string(),
    legacyId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    favorite: v.boolean(),
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
    categoryId: v.optional(v.id("categories")),
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
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("listItems", data);
  },
});
