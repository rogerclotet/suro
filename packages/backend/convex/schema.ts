import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { priorityValidator, recurrenceValidator } from "./model/tasks";

/**
 * Convex schema for the Lists + Calendar slices and their foundations (users,
 * projects/groups, membership). Translated from the Drizzle `f_*` tables.
 * Document `_id`s replace the cuid/uuid foreign keys, and the `f_projectToUser`
 * composite-PK join becomes the `projectMembers` table.
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
    // Convex storage id backing `customImage` when the avatar was uploaded from
    // a native client (lets us delete the old file on replace/remove). Absent
    // for migrated avatars whose `customImage` is an external Uploadthing URL.
    customImageStorageId: v.optional(v.id("_storage")),
    avatarColor: v.optional(v.string()),
    dateLocale: v.optional(v.string()),
    locale: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    // Temporary: source Postgres id, for idempotent migration + FK remapping.
    // Drop (field + by_legacyId indexes + convex/migrations.ts) after cutover.
    legacyId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_legacyId", ["legacyId"]),

  projects: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    inviteToken: v.string(),
    inviteTokenExpiresAt: v.optional(v.number()),
    image: v.optional(v.string()),
    // Convex storage id backing `image` when the group image was uploaded from
    // a native/web client; absent for migrated images whose `image` is an
    // external Uploadthing URL. Mirrors users.customImageStorageId.
    imageStorageId: v.optional(v.id("_storage")),
    color: v.string(),
    // Secret that gates the public .ics calendar feed (lazily generated).
    // Distinct from inviteToken (which joins the group) — never conflate them.
    calendarToken: v.optional(v.string()),
    legacyId: v.optional(v.string()),
  })
    .index("by_inviteToken", ["inviteToken"])
    .index("by_createdBy", ["createdBy"])
    .index("by_calendarToken", ["calendarToken"])
    .index("by_legacyId", ["legacyId"]),

  // Many-to-many membership (replaces f_projectToUser).
  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"]),

  // Per-project autocomplete suggestion store for category names. Items carry
  // their category as a plain name string (see listItems.category); this table
  // only feeds the pickers, auto-upserted (exact-name dedupe) whenever a name
  // is used on an item or template.
  categories: defineTable({
    name: v.string(),
    projectId: v.id("projects"),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    // Exact-name lookup for dedupe on auto-upsert.
    .index("by_project_name", ["projectId", "name"])
    .index("by_legacyId", ["legacyId"]),

  // Calendar events. `startAt`/`endAt` are epoch ms. All-day events store
  // `endAt` as (last day + 1 day) — same convention as the Drizzle app — so the
  // half-open range still overlaps the final day; UIs subtract a day to display.
  events: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    allDay: v.boolean(),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    // Range scan by start within a project (startAt <= window end).
    .index("by_project_start", ["projectId", "startAt"])
    .index("by_legacyId", ["legacyId"]),

  lists: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.id("projects"),
    favorite: v.boolean(),
    // Optional backlink to a calendar event (ON DELETE SET NULL in the Drizzle
    // app — events.remove nulls this manually since Convex has no cascades).
    eventId: v.optional(v.id("events")),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
    // When true the list is a "task list": its items surface optional due dates,
    // assignees, priorities, and repeat rules (see listItems below). Undefined or
    // false = a plain checklist, so existing lists keep their current UI.
    taskMode: v.optional(v.boolean()),
  })
    .index("by_project", ["projectId"])
    // Pre-sorted overview (updatedAt desc) without an in-memory sort.
    .index("by_project_updatedAt", ["projectId", "updatedAt"])
    .index("by_event", ["eventId"])
    .index("by_legacyId", ["legacyId"]),

  listItems: defineTable({
    name: v.string(),
    details: v.optional(v.string()),
    completed: v.boolean(),
    listId: v.id("lists"),
    // The item's category (list section) as a plain name string — sections are
    // derived by grouping items on it, so they're scoped to the list.
    category: v.optional(v.string()),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
    // Optional task fields, only meaningful when the parent list is in task mode.
    // `dueAt` is epoch ms; for an all-day due date it's UTC midnight of the day
    // (a point, not a half-open range like events — no +DAY_MS end).
    dueAt: v.optional(v.number()),
    dueAllDay: v.optional(v.boolean()),
    assigneeId: v.optional(v.id("users")),
    priority: v.optional(priorityValidator),
    recurrence: v.optional(recurrenceValidator),
    // The `dueAt` we already pushed a due reminder for, so the hourly cron sends
    // one reminder per due moment. Cleared whenever `dueAt` changes (edit/reschedule).
    reminderSentForDueAt: v.optional(v.number()),
  })
    .index("by_list", ["listId"])
    .index("by_legacyId", ["legacyId"])
    // Lets the reminder cron range-scan items due up to now across all projects;
    // Convex skips undefined-`dueAt` rows in a range bound, so only real due
    // dates are visited.
    .index("by_due", ["dueAt"]),

  listTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    // `category` holds the category name (the list-section label copied onto
    // items at instantiation), or null.
    items: v.array(
      v.object({ name: v.string(), category: v.union(v.string(), v.null()) }),
    ),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_legacyId", ["legacyId"]),

  // Uploaded files (images/PDFs), stored in Convex file storage. Project-scoped,
  // optionally attached to an event (ON DELETE SET NULL — events.remove nulls
  // eventId manually). `_creationTime` replaces the Drizzle `createdAt`.
  files: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    type: v.string(),
    size: v.number(),
    projectId: v.id("projects"),
    eventId: v.optional(v.id("events")),
    uploadedBy: v.id("users"),
    // Page-1 preview for PDFs, rendered async after upload (see pdfThumbnails).
    // Absent until generated, and for non-PDF types — clients fall back to icons.
    thumbnailStorageId: v.optional(v.id("_storage")),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_event", ["eventId"])
    .index("by_legacyId", ["legacyId"]),

  // Free-text notes. `format` mirrors the Drizzle column ("html" | "plain");
  // the Expo client edits plain text. Optional event backlink (ON DELETE SET
  // NULL — events.remove nulls eventId manually).
  notes: defineTable({
    name: v.string(),
    contents: v.string(),
    format: v.string(),
    projectId: v.id("projects"),
    eventId: v.optional(v.id("events")),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_updatedAt", ["projectId", "updatedAt"])
    .index("by_event", ["eventId"])
    .index("by_legacyId", ["legacyId"]),

  // Expense "pots" (shared tabs). `settledAt` (epoch ms) marks a settled pot;
  // undefined = active. Optional event backlink (ON DELETE SET NULL).
  pots: defineTable({
    name: v.string(),
    projectId: v.id("projects"),
    settledAt: v.optional(v.number()),
    // Source creation time (epoch ms), preserved from the Drizzle `createdAt`.
    // Absent for natively-created pots — reads fall back to `_creationTime`.
    createdAt: v.optional(v.number()),
    createdBy: v.id("users"),
    eventId: v.optional(v.id("events")),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_event", ["eventId"])
    .index("by_legacyId", ["legacyId"]),

  // Pot membership (replaces the f_potToUser join), mirroring projectMembers.
  potMembers: defineTable({
    potId: v.id("pots"),
    userId: v.id("users"),
  })
    .index("by_pot", ["potId"])
    .index("by_user", ["userId"])
    .index("by_pot_user", ["potId", "userId"]),

  // Individual spendings within a pot. `amount` is in cents. `to` set = a direct
  // payment from→to; `to` unset = an equal split among all pot members. `from`
  // unset is unused by the Expo client but kept for migration fidelity.
  spendings: defineTable({
    amount: v.number(),
    currency: v.string(),
    description: v.optional(v.string()),
    from: v.optional(v.id("users")),
    to: v.optional(v.id("users")),
    projectId: v.id("projects"),
    potId: v.optional(v.id("pots")),
    // Source creation time (epoch ms), preserved from the Drizzle `createdAt`.
    // Absent for natively-created spendings — reads fall back to `_creationTime`.
    createdAt: v.optional(v.number()),
    createdBy: v.id("users"),
    legacyId: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_pot", ["potId"])
    .index("by_legacyId", ["legacyId"]),

  // Expo push tokens — one row per device (replaces the PWA's web-push
  // `pushSubscriptions`). Deduped by the token string; rows are pruned when Expo
  // reports the device gone (DeviceNotRegistered), mirroring the web's 404/410
  // pruning.
  pushTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    platform: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),
});
