import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { createAccount } from "@convex-dev/auth/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Native "Sign in with Apple" (Convex Auth credentials provider).
 *
 * The web OAuth redirect flow can't work inside the iOS app: Apple's `form_post`
 * callback is a cross-site POST and Safari/WebKit drop the Convex state cookie,
 * so that flow only survives for Google (which returns via a GET redirect). On
 * iOS the app uses the native `expo-apple-authentication` sheet instead, which
 * returns an identity token — a JWT Apple signs. This provider verifies that
 * token and signs the user in, with no browser or cookie round-trip.
 *
 * The token's `aud` is the app's bundle id (apps/mobile/app.json
 * `ios.bundleIdentifier`). `APPLE_NATIVE_AUDIENCES` overrides the accepted list
 * (comma-separated); add `host.exp.Exponent` on the dev deployment to test in
 * Expo Go on the simulator, where the token is issued to Expo Go's bundle id.
 */

const APPLE_ISSUER = "https://appleid.apple.com";
const DEFAULT_AUDIENCE = "dev.clotet.suro";

// Apple's public signing keys; jose fetches, caches and rotates the JWKS.
const appleJwks = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

function acceptedAudiences(): string[] {
  return (process.env.APPLE_NATIVE_AUDIENCES ?? DEFAULT_AUDIENCE)
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Verify an Apple identity token (RS256 against Apple's JWKS, plus issuer,
 * audience and expiry), returning the stable Apple user id and email. The
 * `keyResolver` is injectable so tests can verify against a local key set
 * instead of reaching out to Apple.
 */
export async function verifyAppleIdentityToken(
  identityToken: string,
  audiences: string[],
  keyResolver: Parameters<typeof jwtVerify>[1] = appleJwks,
): Promise<{ sub: string; email?: string }> {
  const { payload } = await jwtVerify(identityToken, keyResolver, {
    issuer: APPLE_ISSUER,
    audience: audiences,
    algorithms: ["RS256"],
  });
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Apple identity token is missing `sub`");
  }
  const email =
    typeof payload.email === "string" ? payload.email.toLowerCase() : undefined;
  return { sub: payload.sub, email };
}

export const AppleNative = ConvexCredentials({
  id: "apple-native",
  authorize: async (params, ctx) => {
    const identityToken = params.identityToken;
    if (typeof identityToken !== "string" || identityToken.length === 0) {
      throw new Error("Missing Apple identity token");
    }
    const { sub, email } = await verifyAppleIdentityToken(
      identityToken,
      acceptedAudiences(),
    );
    // Apple sends the name only on the user's first authorization; the client
    // forwards it when present. Falling back to the email as the name happens
    // in `afterUserCreatedOrUpdated`, same as the other providers.
    const name =
      typeof params.name === "string" && params.name.trim().length > 0
        ? params.name.trim()
        : undefined;
    // `shouldLinkViaEmail` unifies this with the web Apple OAuth account (a
    // different provider id) and any migrated user sharing the email, so signing
    // in on the web and on iOS lands on the same Suro account.
    const { user } = await createAccount(ctx, {
      provider: "apple-native",
      account: { id: sub },
      // Convex `Value` (and exactOptionalPropertyTypes) reject an explicit
      // `undefined`, so include each field only when Apple actually sent it.
      profile: {
        ...(email !== undefined ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
      },
      shouldLinkViaEmail: email !== undefined,
    });
    return { userId: user._id };
  },
});
