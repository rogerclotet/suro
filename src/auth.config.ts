import type { NextAuthConfig, Profile } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }: { profile?: Profile }): Promise<boolean> {
      return profile?.email !== undefined;
    },
  },
} satisfies NextAuthConfig;
