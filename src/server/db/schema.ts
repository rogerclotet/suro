import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { getRandomValues } from "node:crypto";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `f_${name}`);

export const templates = createTable("listTemplate", {
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
  updatedBy: varchar("updatedBy", { length: 255 }).references(() => users.id, {
    onUpdate: "cascade",
  }),
  projectId: varchar("projectId")
    .notNull()
    .references(() => projects.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

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

export const categories = createTable("category", {
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
});

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
  },
  (l) => ({
    projectIdIdx: index("list_projectId_idx").on(l.projectId),
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

export const events = createTable("event", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startAt: timestamp("startAt", { mode: "date", withTimezone: true }).notNull(),
  endAt: timestamp("endAt", { mode: "date", withTimezone: true }).notNull(),
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
  projectId: varchar("projectId")
    .notNull()
    .references(() => projects.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
    relationName: "project",
  }),
  files: many(files),
  createdBy: one(users, { fields: [events.createdBy], references: [users.id] }),
}));

export const files = createTable("file", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploadedBy", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
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
});

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

export const users = createTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  projects: many(projectToUsers),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, "0");
}

function randomId() {
  const len = 6;
  const arr = new Uint8Array(len / 2);
  getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}
