// @ts-check
/**
 * Generate the AUTH_APPLE_SECRET client secret for "Sign in with Apple".
 *
 * Apple's OAuth "client secret" is NOT a static string: it's a short-lived,
 * self-signed ES256 JWT (ECDSA P-256 + SHA-256) that you re-mint and re-deploy
 * before it expires. Apple's hard cap is 15777000s (~6 months) from `iat`; this
 * script uses 180 days (15552000s) to stay safely under the cap with margin for
 * clock skew. Re-run this on a recurring reminder (every ~5 months) and push the
 * new value to both deployments — there is no auto-rotation.
 *
 * One-time Apple Developer Portal prerequisites (do these once, in order):
 *   1. App ID with the "Sign in with Apple" capability enabled.
 *   2. Services ID (this becomes AUTH_APPLE_ID — the JWT `sub`/client_id), with
 *      Web Authentication Configuration pointing at the App ID and listing each
 *      Convex deployment's Return URL — use each deployment's EXACT HTTP Actions
 *      URL (Convex dashboard → Settings → "HTTP Actions URL"); the dev deployment
 *      carries an `.eu-west-1` region segment, prod does not:
 *        https://incredible-dodo-909.eu-west-1.convex.site/api/auth/callback/apple (dev)
 *        https://marvelous-lobster-518.convex.site/api/auth/callback/apple         (prod)
 *      Domains/subdomains: incredible-dodo-909.eu-west-1.convex.site, marvelous-lobster-518.convex.site
 *      (No apple-developer-domain-association.txt upload is required for the web
 *      Services ID flow — Apple verifies the Return URL by reachability. Sanity-
 *      check a Return URL: `curl -sI <url>` returns 302, not 404.)
 *   3. A Key with "Sign in with Apple" enabled, bound to the App ID. Download the
 *      AuthKey_<KEYID>.p8 ONCE (Apple never lets you re-download it) and note the
 *      10-char Key ID. Your Team ID is in the top-right of the developer portal.
 *
 * Run (from packages/backend), no new dependencies — pure Node `crypto`:
 *
 *   APPLE_TEAM_ID="ABCDE12345" \
 *   APPLE_SERVICES_ID="com.example.app.web" \
 *   APPLE_KEY_ID="KEYID67890" \
 *   APPLE_P8_PATH="./AuthKey_KEYID67890.p8" \
 *   node scripts/generate-apple-secret.mjs
 *
 * It prints the JWT and the exact `npx convex env set` commands (dev + --prod).
 */
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const teamId = required("APPLE_TEAM_ID");
const servicesId = required("APPLE_SERVICES_ID");
const keyId = required("APPLE_KEY_ID");
const p8Path = required("APPLE_P8_PATH");

// Apple rejects secrets that expire > 15777000s after iat. 180 days leaves a
// ~2.6-day margin for the boundary check and any clock skew between us and Apple.
const MAX_LIFETIME_SECONDS = 15_777_000;
const LIFETIME_SECONDS = 180 * 24 * 60 * 60; // 15552000

/** @param {string} name */
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

/** base64url with no padding — the JWT/JWS wire encoding. */
function base64url(/** @type {Buffer} */ input) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** @param {object} json */
function encodeSegment(json) {
  return base64url(Buffer.from(JSON.stringify(json), "utf8"));
}

// Defensive: 180d is hard-coded under the cap, but assert in case the constants
// are ever edited so we fail loudly here instead of with a vague Apple error.
if (LIFETIME_SECONDS > MAX_LIFETIME_SECONDS) {
  console.error(
    `Lifetime ${LIFETIME_SECONDS}s exceeds Apple's max ${MAX_LIFETIME_SECONDS}s.`,
  );
  process.exit(1);
}

// Load the .p8 (PKCS#8). createPrivateKey throws a clear error on a malformed or
// truncated key, so no extra validation is needed here.
let privateKey;
try {
  privateKey = createPrivateKey(readFileSync(p8Path, "utf8"));
} catch (error) {
  console.error(`Failed to read/parse private key at ${p8Path}:`, error);
  process.exit(1);
}

const issuedAt = Math.floor(Date.now() / 1000);
const expiresAt = issuedAt + LIFETIME_SECONDS;

const header = { alg: "ES256", kid: keyId, typ: "JWT" };
// Apple requires EXACTLY these five claims; `exp` must be a number, not a string.
const payload = {
  iss: teamId,
  iat: issuedAt,
  exp: expiresAt,
  aud: "https://appleid.apple.com",
  sub: servicesId,
};

const signingInput = `${encodeSegment(header)}.${encodeSegment(payload)}`;

// ES256 = ECDSA/P-256 + SHA-256. For EC keys the digest MUST be named ('sha256');
// `null` is only for Ed25519/Ed448. JOSE needs the raw r||s signature, so request
// dsaEncoding 'ieee-p1363' — the default 'der' would emit an ASN.1 sig Apple rejects.
const signature = sign("sha256", Buffer.from(signingInput, "utf8"), {
  key: privateKey,
  dsaEncoding: "ieee-p1363",
});

const jwt = `${signingInput}.${base64url(signature)}`;

const expiryIso = new Date(expiresAt * 1000).toISOString();
console.log(`\nAUTH_APPLE_SECRET (ES256 JWT, expires ${expiryIso}):\n`);
console.log(jwt);
console.log(`\nSet it on both deployments (run from packages/backend):\n`);
console.log(`  npx convex env set AUTH_APPLE_ID "${servicesId}"`);
console.log(`  npx convex env set AUTH_APPLE_SECRET "${jwt}"`);
console.log(`  npx convex env set AUTH_APPLE_ID "${servicesId}" --prod`);
console.log(`  npx convex env set AUTH_APPLE_SECRET "${jwt}" --prod\n`);
console.log(
  `Reminder: AUTH_APPLE_SECRET expires ${expiryIso}. Re-run this script and ` +
    `re-set both deployments before then.\n`,
);
