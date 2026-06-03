import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { getRandomColor } from "./model/colors";

/**
 * Convex Auth: Google OAuth + Resend magic-link email — the same providers the
 * Next.js app used (NextAuth). Required deployment env vars:
 *   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_RESEND_KEY, AUTH_EMAIL_FROM,
 *   plus JWT_PRIVATE_KEY + JWKS (generate with `npx @convex-dev/auth`).
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "Suro <onboarding@resend.dev>",
    }),
  ],
  callbacks: {
    // Port of the Next.js `events.createUser` hook: on first sign-in, give the
    // user a "Personal" group + membership, atomically within Convex. Skipped
    // when linking to an existing user (e.g. migrated accounts matched by email).
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId !== null) {
        return;
      }
      const user = await ctx.db.get(userId);
      if (user && !user.name) {
        await ctx.db.patch(userId, { name: user.email });
      }
      const projectId = await ctx.db.insert("projects", {
        name: "Personal",
        createdBy: userId,
        inviteToken: crypto.randomUUID(),
        color: getRandomColor(),
        features: { secretSanta: false },
      });
      await ctx.db.insert("projectMembers", { projectId, userId });
      await ctx.db.patch(userId, { locale: "ca", onboardingCompleted: false });
    },
  },
});
