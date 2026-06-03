import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for the Lists slice + its foundations (users, projects/groups,
 * membership). Translated from the Drizzle `f_*` tables. Document `_id`s replace
 * the cuid/uuid foreign keys, and the `f_projectToUser` composite-PK join
 * becomes the `projectMembers` table. `lists.eventId` is intentionally omitted
 * until the events slice lands (Convex makes adding an optional field trivial).
 */
export default defineSchema({
  // @convex-dev/auth tables (authSessions, authAccounts, ...). We redefine
  // `users` below to extend it with app fields, keeping the required `email` index.
  ...authTables,

  users: defineTable({
    // Fields @convex-dev/auth reads/writes:
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App fields (ported from f_user):
    customImage: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
    dateLocale: v.optional(v.string()),
    locale: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  }).index("email", ["email"]),

  projects: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    inviteToken: v.string(),
    inviteTokenExpiresAt: v.optional(v.number()),
    image: v.optional(v.string()),
    color: v.string(),
    features: v.object({ secretSanta: v.boolean() }),
  })
    .index("by_inviteToken", ["inviteToken"])
    .index("by_createdBy", ["createdBy"]),

  // Many-to-many membership (replaces f_projectToUser).
  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"]),

  categories: defineTable({
    name: v.string(),
    projectId: v.id("projects"),
  }).index("by_project", ["projectId"]),

  lists: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    favorite: v.boolean(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    // Pre-sorted overview (updatedAt desc) without an in-memory sort.
    .index("by_project_updatedAt", ["projectId", "updatedAt"]),

  listItems: defineTable({
    name: v.string(),
    details: v.optional(v.string()),
    completed: v.boolean(),
    listId: v.id("lists"),
    categoryId: v.optional(v.id("categories")),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_category", ["categoryId"]),

  listTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    // `category` holds a category id string (validated against the project at
    // instantiation, mirroring getProjectCategoryId), or null.
    items: v.array(
      v.object({ name: v.string(), category: v.union(v.string(), v.null()) }),
    ),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),
});
