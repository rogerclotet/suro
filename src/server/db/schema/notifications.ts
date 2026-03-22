import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const notifications = createTable("notification", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }),
  body: text("body").notNull(),
  path: varchar("path", { length: 512 }),
  section: varchar("section", { length: 50 }).notNull(),
  image: varchar("image", { length: 512 }),
  projectId: varchar("projectId", { length: 255 })
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdBy: varchar("createdBy", { length: 255 })
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
  }),
}));

export const notificationReads = createTable(
  "notificationRead",
  {
    notificationId: varchar("notificationId", { length: 255 })
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("readAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.notificationId, table.userId] })],
);

export const notificationReadsRelations = relations(
  notificationReads,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationReads.notificationId],
      references: [notifications.id],
    }),
    user: one(users, {
      fields: [notificationReads.userId],
      references: [users.id],
    }),
  }),
);

export const notificationDigests = createTable(
  "notificationDigest",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    type: varchar("type", { length: 50 }).notNull(),
    section: varchar("section", { length: 50 }).notNull(),
    actorName: varchar("actorName", { length: 255 }).notNull(),
    count: integer("count").notNull().default(1),
    listId: varchar("listId", { length: 255 }).notNull(),
    listName: varchar("listName", { length: 255 }).notNull(),
    projectId: varchar("projectId", { length: 255 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdBy: varchar("createdBy", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sendAfter: timestamp("sendAfter", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    sendAfterIdx: index("notificationDigest_sendAfter_idx").on(table.sendAfter),
    projectIdIdx: index("notificationDigest_projectId_idx").on(table.projectId),
  }),
);

export const notificationDigestsRelations = relations(
  notificationDigests,
  ({ one }) => ({
    project: one(projects, {
      fields: [notificationDigests.projectId],
      references: [projects.id],
    }),
    creator: one(users, {
      fields: [notificationDigests.createdBy],
      references: [users.id],
    }),
  }),
);
