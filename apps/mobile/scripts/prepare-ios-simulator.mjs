/**
 * Strips iOS entitlements that need a provisioning profile but aren't required
 * for local simulator builds (Sign in with Apple). `app.config.ts` already
 * drops the `expo-apple-authentication` plugin when `LOCAL_IOS_SIM_BUILD=1`,
 * but prebuild can still write the entitlement via autolinking — which makes
 * `expo run:ios` fail with "No code signing certificates are available."
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const entitlementsPath = resolve(
  import.meta.dirname,
  "../ios/Suro/Suro.entitlements",
);

let raw;
try {
  raw = readFileSync(entitlementsPath, "utf8");
} catch {
  // No native project yet — prebuild will create it.
  process.exit(0);
}

const stripped = raw.replace(
  /\s*<key>com\.apple\.developer\.applesignin<\/key>\s*<array>\s*<string>Default<\/string>\s*<\/array>/,
  "",
);

if (stripped !== raw) {
  writeFileSync(entitlementsPath, stripped);
}
