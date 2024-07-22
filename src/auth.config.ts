import type { NextAuthConfig, Profile } from "next-auth";
import Google from "next-auth/providers/google";
import posthog from "posthog-js";
import { env } from "./env";

export default {
  providers: [Google],
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }: { profile?: Profile }): Promise<boolean> {
      return profile?.email !== undefined;
    },
    async session({ session, user }) {
      posthog.identify(user.id, { email: user.email, name: user.name });

      session.user.id = user.id;
      return session;
    },
  },
} satisfies NextAuthConfig;
