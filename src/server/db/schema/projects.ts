import { relations } from "drizzle-orm";
import { primaryKey, uuid, varchar } from "drizzle-orm/pg-core";
import { categories, lists, templates } from "./lists";
import { notes } from "./notes";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const projects = createTable("project", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: varchar("createdBy", { length: 255 })
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
  inviteToken: uuid("inviteToken").defaultRandom().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  users: many(projectToUsers),
  lists: many(lists),
  templates: many(templates),
  categories: many(categories),
  notes: many(notes),
}));

export const projectToUsers = createTable(
  "projectToUser",
  {
    projectId: varchar("projectId")
      .notNull()
      .references(() => projects.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (ptu) => ({
    pk: primaryKey({ columns: [ptu.projectId, ptu.userId] }),
  }),
);

export const projectToUsersRelations = relations(projectToUsers, ({ one }) => ({
  project: one(projects, {
    fields: [projectToUsers.projectId],
    references: [projects.id],
  }),
  user: one(users, { fields: [projectToUsers.userId], references: [users.id] }),
}));
