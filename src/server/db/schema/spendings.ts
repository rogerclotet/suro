import { relations, sql } from "drizzle-orm";
import { integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pots } from "./pots";
import { projects } from "./projects";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const spendings = createTable("spending", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 255 }).notNull(),
  description: text("description"),
  from: varchar("from", { length: 255 }).references(() => users.id, {
    onUpdate: "cascade",
  }),
  to: varchar("to", { length: 255 }).references(() => users.id, {
    onUpdate: "cascade",
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
  projectId: varchar("projectId")
    .notNull()
    .references(() => projects.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  potId: varchar("potId").references(() => pots.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const spendingsRelations = relations(spendings, ({ one }) => ({
  from: one(users, { fields: [spendings.from], references: [users.id] }),
  to: one(users, { fields: [spendings.to], references: [users.id] }),
  project: one(projects, {
    fields: [spendings.projectId],
    references: [projects.id],
    relationName: "project",
  }),
  pot: one(pots, {
    fields: [spendings.potId],
    references: [pots.id],
  }),
}));
