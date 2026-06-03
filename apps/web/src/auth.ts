import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { getPostHogServer } from "./lib/posthog-server";
import { db } from "./server/db";
import {
  accounts,
  projects,
  projectToUsers,
  sessions,
  users,
  verificationTokens,
} from "./server/db/schema";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  logger: {
    // Auth.js handles errors like CallbackRouteError internally and only reports
    // them through this logger — they never bubble up to Next's onRequestError,
    // which is why these failures were invisible in PostHog. Forward them here.
    error: (error) => {
      console.error(`[auth][error] ${error.message}`);
      if (process.env.NODE_ENV === "production") {
        getPostHogServer().captureException(error, undefined, {
          source: "next-auth",
          errorName: error.name,
        });
      }
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.id) {
        throw new Error("User id not found");
      }

      const userId = user.id;

      await db.transaction(async (trx) => {
        try {
          if (user.name === "" || !user.name) {
            await trx
              .update(users)
              .set({ name: user.email })
              .where(eq(users.id, userId));
          }

          const result = await trx
            .insert(projects)
            .values({
              name: "Personal",
              createdBy: userId,
            })
            .returning({ id: projects.id });

          if (result.length === 0 || !result[0]) {
            throw new Error("Failed to create personal project");
          }

          await trx.insert(projectToUsers).values({
            projectId: result[0].id,
            userId: userId,
          });
        } catch (e) {
          trx.rollback();
          const posthog = getPostHogServer();
          posthog.captureException(e, userId, {
            action: "create_user",
          });
          throw e;
        }
      });
    },
  },
  ...authConfig,
});
