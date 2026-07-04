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
 * 2. Applies the `dev` app variant (`APP_VARIANT=dev`): a distinct
 *    package / bundle id (`dev.clotet.surodev`), app name ("Suro Dev"), and
 *    custom scheme ("surodev"), so a dev build installs alongside the Play
 *    Store / App Store prod app instead of replacing it. The dev variant also
 *    drops the prod deep-link config (Android `intentFilters` to
 *    suro.clotet.dev, iOS `associatedDomains`) so it never hijacks production
 *    universal links, and drops `googleServicesFile` since the prod
 *    google-services.json only declares the prod package — keeping it would
 *    fail the Google Services Gradle step on a package mismatch. (Remote push
 *    is not wired up E2E anyway; local notifications still work without it.)
 *
 * 3. Drops the two iOS entitlements a local `expo run:ios` simulator build can't
 *    sign — Sign in with Apple (the `expo-apple-authentication` plugin) and
 *    `associatedDomains` (universal links to suro.clotet.dev). Both need a
 *    provisioning profile, so on the simulator they fail with "No code signing
 *    certificates are available." `prebuild` rewrites the native files every run,
 *    so this has to be filtered here.
 *
 *    This is gated on `LOCAL_IOS_SIM_BUILD` (set only by the `ios` package
 *    script), NOT on `EAS_BUILD`. app.json is the single source of truth for
 *    these entitlements: every EAS build keeps them, so EAS's capability syncing
 *    enables and then maintains the capabilities on the App ID. Gating on
 *    `EAS_BUILD` failed because EAS runs the capability-sync introspection
 *    BEFORE `EAS_BUILD` is set — it saw the stripped config and disabled
 *    Associated Domains mid-build, breaking signing.
 */

const { version } = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
) as { version: string };

const APPLE_AUTH_PLUGIN = "expo-apple-authentication";

const DEV_VARIANT = {
  name: "Suro Dev",
  scheme: "surodev",
  appId: "dev.clotet.surodev",
  // Cool dark teal vs the prod dark-brown (#17100c) so the dev app's adaptive
  // icon is unmistakable on the home screen; the warm tan logo still reads.
  adaptiveIconBackgroundColor: "#0d3b3f",
} as const;

/**
 * Applies the `dev` variant overrides onto the resolved config so a dev build
 * coexists with the prod app. No-op unless `APP_VARIANT=dev`.
 */
const applyVariant = (resolved: ExpoConfig): ExpoConfig => {
  if (process.env.APP_VARIANT !== "dev") {
    return resolved;
  }
  return {
    ...resolved,
    name: DEV_VARIANT.name,
    scheme: DEV_VARIANT.scheme,
    ios: resolved.ios
      ? {
          ...resolved.ios,
          bundleIdentifier: DEV_VARIANT.appId,
          associatedDomains: undefined,
        }
      : resolved.ios,
    android: resolved.android
      ? {
          ...resolved.android,
          package: DEV_VARIANT.appId,
          googleServicesFile: undefined,
          intentFilters: undefined,
          adaptiveIcon: resolved.android.adaptiveIcon
            ? {
                ...resolved.android.adaptiveIcon,
                backgroundColor: DEV_VARIANT.adaptiveIconBackgroundColor,
              }
            : resolved.android.adaptiveIcon,
        }
      : resolved.android,
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const resolved = applyVariant({ ...(config as ExpoConfig), version });
  // Only a local `expo run:ios` sim build strips entitlements it can't sign;
  // everything else (EAS builds and EAS's capability-sync introspection) keeps
  // them, so EAS enables and maintains the capabilities from app.json.
  if (process.env.LOCAL_IOS_SIM_BUILD !== "1") {
    return resolved;
  }
  return {
    ...resolved,
    ios: resolved.ios
      ? { ...resolved.ios, associatedDomains: undefined }
      : resolved.ios,
    plugins: (resolved.plugins ?? []).filter(
      (plugin) =>
        (Array.isArray(plugin) ? plugin[0] : plugin) !== APPLE_AUTH_PLUGIN,
    ),
  };
};
