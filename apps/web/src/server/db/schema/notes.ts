import { relations, sql } from "drizzle-orm";
import { index, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createTable } from "./create-table";
import { events } from "./events";
import { projects } from "./projects";
import { users } from "./users";
import { randomId } from "./utils";

export const notes = createTable(
  "note",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    contents: text("contents").notNull(),
    format: varchar("format", { length: 255 }).notNull(),
    createdBy: varchar("uploadedBy", { length: 255 })
      .notNull()
      .references(() => users.id, {
        onDelete: "set null",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedBy: varchar("updatedBy", { length: 255 }).references(
      () => users.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),
    updatedAt: timestamp("updatedAt", {
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
  (n) => ({
    projectIdIdx: index("note_projectId_idx").on(n.projectId),
    eventIdIdx: index("note_eventId_idx").on(n.eventId),
  }),
);

export const notesRelations = relations(notes, ({ one }) => ({
  project: one(projects, {
    fields: [notes.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [notes.createdBy],
    references: [users.id],
  }),
  updatedBy: one(users, {
    fields: [notes.updatedBy],
    references: [users.id],
  }),
  event: one(events, { fields: [notes.eventId], references: [events.id] }),
}));
