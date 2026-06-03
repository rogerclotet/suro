import type { NextAuthConfig, Profile } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { env } from "./env";

export default {
  providers: [
    Google,
    Resend({
      from: env.RESEND_EMAIL_FROM,
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    // Route auth failures (including the "iss missing" CallbackRouteError that
    // Google triggers when a user cancels account selection) back to the login
    // screen instead of Auth.js's built-in "Server error" page. The login page
    // surfaces a friendly, retryable message based on the `error` query param.
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }: { profile?: Profile }): Promise<boolean> {
      if (profile) {
        return profile?.email !== undefined;
      }
      // Allow all users from email magic links to sign in
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.customImage = (user as unknown as Record<string, unknown>)
        .customImage as string | null;
      session.user.avatarColor = (user as unknown as Record<string, unknown>)
        .avatarColor as string | null;
      session.user.dateLocale = (user as unknown as Record<string, unknown>)
        .dateLocale as string | null;
      session.user.locale = (user as unknown as Record<string, unknown>)
        .locale as string | null;
      session.user.onboardingCompleted = (
        user as unknown as Record<string, unknown>
      ).onboardingCompleted as boolean;
      return session;
    },
  },
} satisfies NextAuthConfig;
