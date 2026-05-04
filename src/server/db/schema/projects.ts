import { relations } from "drizzle-orm";
import { primaryKey, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { categories, lists, templates } from "./lists";
import { notes } from "./notes";
import { pots } from "./pots";
import { secretSantas } from "./secret-santa";
import { spendings } from "./spendings";
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
  inviteTokenExpiresAt: timestamp("inviteTokenExpiresAt", {
    mode: "date",
    withTimezone: true,
  }),
  image: varchar("image", { length: 512 }),
  color: varchar("color", { length: 20 }).notNull().default("blue"),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  users: many(projectToUsers),
  lists: many(lists),
  templates: many(templates),
  categories: many(categories),
  notes: many(notes),
  spendings: many(spendings),
  pots: many(pots),
  secretSantas: many(secretSantas),
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
