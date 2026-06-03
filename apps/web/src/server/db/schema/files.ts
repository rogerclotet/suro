import { relations, sql } from "drizzle-orm";
import { index, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { events } from "./events";
import { projects } from "./projects";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const files = createTable(
  "file",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    thumbnailUrl: varchar("thumbnailUrl", { length: 255 }),
    type: varchar("type", { length: 255 }).notNull(),
    size: integer("size").notNull(),
    uploadedBy: varchar("uploadedBy", { length: 255 })
      .notNull()
      .references(() => users.id, {
        onDelete: "set null",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    projectId: varchar("projectId")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    eventId: varchar("eventId").references(() => events.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (f) => ({
    projectIdIdx: index("file_projectId_idx").on(f.projectId),
    eventIdIdx: index("file_eventId_idx").on(f.eventId),
  }),
);

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
  event: one(events, { fields: [files.eventId], references: [events.id] }),
}));
