import Apple from "@auth/core/providers/apple";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { AppleNative } from "./AppleNative";
import { track } from "./model/analytics";
import { getRandomColor } from "./model/colors";
import { ResendOTP } from "./ResendOTP";

/**
 * Convex Auth: Google + Apple OAuth + email one-time-code (Resend). Required
 * deployment env vars:
 *   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET (Google), AUTH_RESEND_KEY, AUTH_EMAIL_FROM
 *   (email OTP), SITE_URL, plus JWT_PRIVATE_KEY + JWKS (`npx @convex-dev/auth`).
 * Optional: ALLOWED_WEB_ORIGINS (see `isAllowedWebOrigin`), and AUTH_APPLE_ID +
 *   AUTH_APPLE_SECRET (web Apple OAuth; the secret is a self-signed ES256 JWT
 *   that expires after at most 6 months — regenerate it before then). The web
 *   client hides its Apple button until those are set (see `oauthProviders`).
 * iOS uses native Sign in with Apple instead (see `AppleNative`), which needs no
 *   secret — just the App ID's Sign in with Apple capability.
 */

/** Apple's `user` payload, sent only on the user's very first authorization. */
type AppleFirstAuthUser = {
  name?: { firstName?: string; lastName?: string };
  email?: string;
};

/**
 * Whether an absolute web `redirectTo` may be returned to after an OAuth
 * round-trip. The web client sends its own origin, because a single deployment
 * can serve many origins — the dev backend is shared by localhost and every
 * `mr-*.suro.clotet.dev` preview, so SITE_URL alone can't validate them.
 *
 * Reads a comma-separated `ALLOWED_WEB_ORIGINS` (falling back to SITE_URL).
 * Each entry is an exact origin, or may use a leading `*.` to match any
 * subdomain, e.g. `https://*.suro.clotet.dev` matches `mr-12.suro.clotet.dev`.
 */
function isAllowedWebOrigin(redirectTo: string): boolean {
  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    return false;
  }
  const allowlist = (
    process.env.ALLOWED_WEB_ORIGINS ??
    process.env.SITE_URL ??
    ""
  )
    .split(",")
    .map((entry) => entry.trim().replace(/\/$/, ""))
    .filter((entry) => entry.length > 0);

  return allowlist.some((entry) => {
    const wildcard = entry.match(/^(https?:\/\/)\*\.(.+)$/);
    if (wildcard === null) {
      return url.origin === entry;
    }
    const [, scheme, baseDomain] = wildcard;
    return (
      `${url.protocol}//` === scheme &&
      (url.hostname === baseDomain || url.hostname.endsWith(`.${baseDomain}`))
    );
  });
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    // Defaults (scope `name email`, `form_post`, `client_secret_post`) are
    // what Apple requires; only the profile mapping needs overriding, because
    // Apple sends the user's name solely on the first authorization.
    Apple({
      profile: (appleInfo) => {
        const firstAuthUser = appleInfo.user as AppleFirstAuthUser | undefined;
        const name = [
          firstAuthUser?.name?.firstName,
          firstAuthUser?.name?.lastName,
        ]
          .filter(Boolean)
          .join(" ");
        return {
          // Falling back to the email as the name happens in
          // `afterUserCreatedOrUpdated`, same as for the other providers.
          id: appleInfo.sub,
          name: name === "" ? undefined : name,
          email: appleInfo.email,
        };
      },
    }),
    // Native "Sign in with Apple" for iOS — verifies the identity token from the
    // `expo-apple-authentication` sheet. The web redirect flow above can't run
    // inside the app (Safari drops the state cookie on Apple's cross-site POST).
    AppleNative,
    ResendOTP,
  ],
  callbacks: {
    // Validate the post-flow redirect. Overriding Convex Auth's default means we
    // own every branch the default handled (native deep links, relative paths,
    // SITE_URL absolutes) plus cross-origin web returns for shared deployments.
    async redirect({ redirectTo }) {
      // Native deep links (suro:// standalone, exp:// Expo Go) round-trip as-is.
      if (redirectTo.startsWith("suro://") || redirectTo.startsWith("exp://")) {
        return redirectTo;
      }
      // Absolute web URL: the client passes its own origin so the round-trip
      // returns to the right host (prod, a preview, or localhost). A single
      // SITE_URL can't cover the previews that share this backend, so validate
      // the origin against the allowlist instead.
      if (
        redirectTo.startsWith("http://") ||
        redirectTo.startsWith("https://")
      ) {
        if (isAllowedWebOrigin(redirectTo)) {
          return redirectTo;
        }
        throw new Error(`Invalid redirectTo origin: ${redirectTo}`);
      }
      // Relative path: resolve against this deployment's canonical origin.
      const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
      if (redirectTo.startsWith("/") || redirectTo.startsWith("?")) {
        return `${siteUrl}${redirectTo}`;
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
      await track(ctx, userId, "signed_up");
    },
  },
});

/**
 * Which optional OAuth providers have credentials on this deployment, so the
 * login screens can hide a provider's button until it's configured (Apple
 * needs the paid developer enrollment) instead of baking flags into each
 * client build. Deliberately public and auth-free: it feeds the login screen.
 */
export const oauthProviders = query({
  args: {},
  handler: async () => ({
    apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
  }),
});
