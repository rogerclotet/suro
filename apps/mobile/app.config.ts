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
 * 2. Keeps entitlements that need a provisioning profile off builds that can't
 *    sign them:
 *    - `associatedDomains` (universal links to suro.clotet.dev) ships only in the
 *      production build. It needs the App ID's Associated Domains capability and a
 *      matching provisioning profile; local and dev/preview builds don't have
 *      those, so EAS fails with "provisioning profile doesn't include the
 *      Associated Domains capability." Gated on `EAS_BUILD_PROFILE === "production"`
 *      (set by `build:ios:release`, which runs `eas build --profile production`).
 *    - Sign in with Apple (the `expo-apple-authentication` plugin) is kept on every
 *      EAS build so native login is testable, and dropped only on local builds
 *      (`expo run:ios`, which can't sign it either).
 *    `prebuild` rewrites the native config on every run, so hand-editing the
 *    generated files never sticks — these have to be filtered here. Test native
 *    Apple on a dev/preview EAS build (or Expo Go, which carries its own Apple
 *    entitlement), not `expo run:ios`.
 */

const { version } = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
) as { version: string };

const APPLE_AUTH_PLUGIN = "expo-apple-authentication";

export default ({ config }: ConfigContext): ExpoConfig => {
  const resolved: ExpoConfig = { ...(config as ExpoConfig), version };
  const isEasBuild = process.env.EAS_BUILD === "true";
  const keepAssociatedDomains = process.env.EAS_BUILD_PROFILE === "production";
  return {
    ...resolved,
    ios:
      resolved.ios && !keepAssociatedDomains
        ? { ...resolved.ios, associatedDomains: undefined }
        : resolved.ios,
    // The Apple plugin (Sign in with Apple entitlement) stays on EAS builds and
    // is dropped only locally, where `expo run:ios` can't sign it.
    plugins: isEasBuild
      ? resolved.plugins
      : (resolved.plugins ?? []).filter(
          (plugin) =>
            (Array.isArray(plugin) ? plugin[0] : plugin) !== APPLE_AUTH_PLUGIN,
        ),
  };
};
