import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { Logger } from "next-axiom";
import authConfig from "./auth.config";
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
  events: {
    createUser: async ({ user }) => {
      if (!user.id) {
        throw new Error("User id not found");
      }

      await db.transaction(async (trx) => {
        try {
          if (user.name === "" || !user.name) {
            await trx
              .update(users)
              .set({ name: user.email })
              .where(eq(users.id, user.id!));
          }

          const result = await trx
            .insert(projects)
            .values({
              name: "Personal",
              createdBy: user.id!,
            })
            .returning({ id: projects.id });

          if (result.length === 0) {
            throw new Error("Failed to create personal project");
          }

          await trx.insert(projectToUsers).values({
            projectId: result[0]!.id,
            userId: user.id!,
          });
        } catch (e) {
          trx.rollback();
          const log = new Logger();
          log.error("Failed to create user", { error: e });
          await log.flush();
          throw e;
        }
      });
    },
  },
  ...authConfig,
});
