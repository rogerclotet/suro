import type { NextAuthConfig, Profile } from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./server/db";
import { projects, projectToUsers } from "./server/db/schema";

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
  events: {
    createUser: async ({ user }) => {
      const result = await db
        .insert(projects)
        .values({
          name: "Personal",
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
} satisfies NextAuthConfig;
