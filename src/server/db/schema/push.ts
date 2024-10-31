import { relations } from "drizzle-orm";
import { jsonb, varchar } from "drizzle-orm/pg-core";
import { type PushSubscription } from "web-push";
import { users } from "./users";
import { createTable, randomId } from "./utils";

export const pushSubscriptions = createTable("pushSubscription", {
  id: varchar("id", { length: 255 })
    .$defaultFn(randomId)
    .notNull()
    .primaryKey(),
  subscription: jsonb("subscription").$type<PushSubscription>().notNull(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
});

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
      relationName: "user",
    }),
  }),
);
