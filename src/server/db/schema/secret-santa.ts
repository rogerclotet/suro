import { relations, sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  ExclusionData,
  GiftIdeaData,
  PriceRangeData,
} from "@/app/_data/secret-santa";
import { projects } from "./projects";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const secretSantas = createTable("secretSanta", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  projectId: varchar("projectId")
    .notNull()
    .references(() => projects.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  datetime: timestamp("datetime", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  priceRange: jsonb("priceRange").$type<PriceRangeData>().notNull(),
  exclusions: jsonb("exclusions")
    .$type<ExclusionData[]>()
    .notNull()
    .default([]),
  assignmentsDone: boolean("assignmentsDone").notNull().default(false),
  archivedAt: timestamp("archivedAt", {
    mode: "date",
    withTimezone: true,
  }),
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
  updatedBy: varchar("updatedBy", { length: 255 }).references(() => users.id, {
    onUpdate: "cascade",
  }),
});

export const secretSantaRelations = relations(
  secretSantas,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [secretSantas.projectId],
      references: [projects.id],
    }),
    participants: many(secretSantaParticipants),
  }),
);

export const secretSantaParticipants = createTable(
  "secretSantaParticipant",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(randomId)
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    secretSantaId: varchar("secretSantaId", { length: 255 })
      .notNull()
      .references(() => secretSantas.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    assignedTo: varchar("assignedTo", { length: 255 }).references(
      () => users.id,
      { onDelete: "set null", onUpdate: "cascade" },
    ),
    giftIdeas: jsonb("giftIdeas").$type<GiftIdeaData[]>().notNull().default([]),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    }).$onUpdate(() => new Date()),
  },
  (sp) => [unique("unique_user_secret_santa").on(sp.userId, sp.secretSantaId)],
);

export const secretSantaParticipantsRelations = relations(
  secretSantaParticipants,
  ({ one }) => ({
    user: one(users, {
      fields: [secretSantaParticipants.userId],
      references: [users.id],
    }),
    assignedTo: one(users, {
      fields: [secretSantaParticipants.assignedTo],
      references: [users.id],
    }),
    secretSanta: one(secretSantas, {
      fields: [secretSantaParticipants.secretSantaId],
      references: [secretSantas.id],
    }),
  }),
);
