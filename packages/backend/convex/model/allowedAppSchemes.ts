// The production app's scheme (apps/mobile/app.json `scheme`).
const DEFAULT_APP_SCHEMES = "suro";

const SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i;

function parseSchemes(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/** Validate against an explicit comma-separated scheme list. */
export function isAllowedAppRedirectWithSchemes(
  redirectTo: string,
  schemesRaw: string,
): boolean {
  const scheme = SCHEME.exec(redirectTo)?.[1]?.toLowerCase();
  if (scheme === undefined) {
    return false;
  }
  // Web origins have their own allowlist (see `isAllowedWebOrigin`); a scheme
  // list must never be able to open them up.
  if (scheme === "http" || scheme === "https") {
    return false;
  }
  return parseSchemes(schemesRaw).includes(scheme);
}

/**
 * Whether a native deep link may receive the sign-in code after an OAuth
 * round-trip.
 *
 * The code is delivered to whichever app handles the link, and whoever started
 * the flow can redeem it. So every accepted scheme is a place a phishing link
 * can send a victim's code: `exp://` hands it to any project opened in Expo Go.
 * Production therefore accepts only the released app's scheme.
 *
 * Reads a comma-separated `ALLOWED_APP_SCHEMES`, defaulting to `suro`. The dev
 * deployment sets `suro,surodev,exp` for the dev app variant and Expo Go.
 */
export function isAllowedAppRedirect(redirectTo: string): boolean {
  return isAllowedAppRedirectWithSchemes(
    redirectTo,
    process.env.ALLOWED_APP_SCHEMES ?? DEFAULT_APP_SCHEMES,
  );
}
