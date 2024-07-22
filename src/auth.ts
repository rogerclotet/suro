import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
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
      const result = await db
        .insert(projects)
        .values({
          name: "Personal",
          createdBy: user.id!,
        })
        .returning({ id: projects.id });

      if (result.length === 0) {
        throw new Error("Failed to create personal project");
      }

      await db.insert(projectToUsers).values({
        projectId: result[0]!.id,
        userId: user.id!,
      });
    },
  },
  ...authConfig,
});
