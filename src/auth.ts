import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "./server/db";
import {
  accounts,
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
  ...authConfig,
});
