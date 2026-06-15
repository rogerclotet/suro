import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config layered on top of `app.json`. It does two things:
 *
 * 1. Sources the user-facing `version` (Android versionName / iOS
 *    CFBundleShortVersionString, e.g. "1.7.0") from the monorepo root
 *    `package.json` — the single version of record, kept in lockstep with the
 *    web app and the top entry of CHANGELOG.md. This keeps the store version in
 *    sync with each release instead of a literal that silently goes stale in
 *    app.json. The Android versionCode / iOS build number are separate: EAS
 *    manages those via remote auto-increment (`appVersionSource: "remote"` in
 *    eas.json), so they bump on every build regardless of this value.
 *
 * 2. Keeps the iOS `associatedDomains` entitlement (universal links to
 *    suro.clotet.dev) out of local builds. That entitlement requires a
 *    provisioning profile, so `expo run:ios` against the simulator fails with
 *    "No code signing certificates are available." Because `prebuild` rewrites
 *    `ios/Suro/Suro.entitlements` from the config on every run, hand-editing the
 *    generated file never sticks. EAS builds set `EAS_BUILD=true` (this includes
 *    the local `eas build` used by `build:ios:release`), so production builds
 *    keep the entitlement and universal links still work in the shipped app.
 */

const { version } = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
) as { version: string };

export default ({ config }: ConfigContext): ExpoConfig => {
  const resolved: ExpoConfig = { ...(config as ExpoConfig), version };
  const isEasBuild = process.env.EAS_BUILD === "true";
  if (isEasBuild || !resolved.ios?.associatedDomains) {
    return resolved;
  }
  return {
    ...resolved,
    ios: { ...resolved.ios, associatedDomains: undefined },
  };
};
