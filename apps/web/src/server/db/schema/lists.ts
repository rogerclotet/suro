import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { projects } from "./projects";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const templates = createTable(
  "listTemplate",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    items: jsonb("items").notNull(),
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
  (t) => ({
    projectIdIdx: index("listTemplate_projectId_idx").on(t.projectId),
  }),
);

export const templatesRelations = relations(templates, ({ one }) => ({
  project: one(projects, {
    fields: [templates.projectId],
    references: [projects.id],
    relationName: "project",
  }),
}));

export const listItems = createTable(
  "listItem",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    details: text("details"),
    completed: boolean("completed").default(false),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    createdBy: varchar("createdBy", { length: 255 })
      .references(() => users.id, { onUpdate: "cascade" })
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    }).$onUpdate(() => new Date()),
    updatedBy: varchar("updatedBy", { length: 255 }).references(
      () => users.id,
      { onUpdate: "cascade" },
    ),
    listId: varchar("listId")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade", onUpdate: "cascade" }),
    categoryId: varchar("categoryId").references(() => categories.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (li) => ({
    listIdIdx: index("listItem_listId_idx").on(li.listId),
    categoryIdIdx: index("listItem_categoryId_idx").on(li.categoryId),
  }),
);

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(lists, {
    fields: [listItems.listId],
    references: [lists.id],
    relationName: "list",
  }),
  category: one(categories, {
    fields: [listItems.categoryId],
    references: [categories.id],
    relationName: "category",
  }),
}));

export const categories = createTable(
  "category",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    projectId: varchar("projectId")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (c) => ({
    projectIdIdx: index("category_projectId_idx").on(c.projectId),
  }),
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  items: many(listItems),
  project: one(projects, {
    fields: [categories.projectId],
    references: [projects.id],
  }),
}));

export const lists = createTable(
  "list",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    createdBy: varchar("createdBy", { length: 255 })
      .references(() => users.id, { onUpdate: "cascade" })
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    }).$onUpdate(() => new Date()),
    updatedBy: varchar("updatedBy", { length: 255 }).references(() => users.id),
    description: text("description"),
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
    favorite: boolean("favorite").default(false).notNull(),
  },
  (l) => ({
    projectIdIdx: index("list_projectId_idx").on(l.projectId),
    eventIdIdx: index("list_eventId_idx").on(l.eventId),
  }),
);

export const listsRelations = relations(lists, ({ one, many }) => ({
  project: one(projects, {
    fields: [lists.projectId],
    references: [projects.id],
    relationName: "project",
  }),
  items: many(listItems),
  event: one(events, { fields: [lists.eventId], references: [events.id] }),
}));
