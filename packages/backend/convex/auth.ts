import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { getRandomColor } from "./model/colors";
import { ResendOTP } from "./ResendOTP";

/**
 * Convex Auth: Google OAuth + email one-time-code (Resend). Required deployment
 * env vars:
 *   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET (Google), AUTH_RESEND_KEY, AUTH_EMAIL_FROM
 *   (email OTP), SITE_URL, plus JWT_PRIVATE_KEY + JWKS (`npx @convex-dev/auth`).
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, ResendOTP],
  callbacks: {
    // Allow finishing an OAuth flow back into the native app (suro:// / exp://
    // deep link) on top of Convex Auth's default web handling. The default only
    // accepts relative paths and SITE_URL-prefixed absolutes; overriding it
    // means we must re-implement that web branch too, or the web client's
    // relative `redirectTo` (e.g. "/") gets rejected.
    async redirect({ redirectTo }) {
      if (redirectTo.startsWith("suro://") || redirectTo.startsWith("exp://")) {
        return redirectTo;
      }
      const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
      // Relative paths from the web app — resolve against SITE_URL.
      if (redirectTo.startsWith("/") || redirectTo.startsWith("?")) {
        return `${siteUrl}${redirectTo}`;
      }
      // Absolute URLs already under the web origin.
      if (siteUrl !== "" && redirectTo.startsWith(siteUrl)) {
        return redirectTo;
      }
      throw new Error(`Invalid redirectTo: ${redirectTo}`);
    },
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
      });
      await ctx.db.insert("projectMembers", { projectId, userId });
      await ctx.db.patch(userId, { locale: "ca", onboardingCompleted: false });
    },
  },
});
