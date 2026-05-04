import { relations, sql } from "drizzle-orm";
import { boolean, index, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { files } from "./files";
import { projects } from "./projects";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const events = createTable(
  "event",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startAt: timestamp("startAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endAt: timestamp("endAt", { mode: "date", withTimezone: true }).notNull(),
    allDay: boolean("allDay").notNull().default(false),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    createdBy: varchar("createdBy", { length: 255 })
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    }).$onUpdate(() => new Date()),
    updatedBy: varchar("updatedBy", { length: 255 }).references(
      () => users.id,
      {
        onUpdate: "cascade",
      },
    ),
    projectId: varchar("projectId")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (e) => ({
    projectIdIdx: index("event_projectId_idx").on(e.projectId),
    projectStartIdx: index("event_projectId_startAt_idx").on(
      e.projectId,
      e.startAt,
    ),
  }),
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
    relationName: "project",
  }),
  files: many(files),
  createdBy: one(users, { fields: [events.createdBy], references: [users.id] }),
}));
