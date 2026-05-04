import { relations, sql } from "drizzle-orm";
import { index, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { spendings } from "./spendings";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const pots = createTable(
  "pot",
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
    settledAt: timestamp("settledAt", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    createdBy: varchar("createdBy", { length: 255 })
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
  },
  (p) => ({
    projectIdIdx: index("pot_projectId_idx").on(p.projectId),
  }),
);

export const potsRelations = relations(pots, ({ one, many }) => ({
  project: one(projects, {
    fields: [pots.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [pots.createdBy],
    references: [users.id],
  }),
  users: many(potToUsers),
  spendings: many(spendings),
}));

export const potToUsers = createTable(
  "potToUser",
  {
    potId: varchar("potId")
      .notNull()
      .references(() => pots.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (ptu) => ({
    pk: primaryKey({ columns: [ptu.potId, ptu.userId] }),
    userIdIdx: index("potToUser_userId_idx").on(ptu.userId),
  }),
);

export const potToUsersRelations = relations(potToUsers, ({ one }) => ({
  pot: one(pots, { fields: [potToUsers.potId], references: [pots.id] }),
  user: one(users, { fields: [potToUsers.userId], references: [users.id] }),
}));
