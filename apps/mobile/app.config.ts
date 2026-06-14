import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic Expo config layered on top of `app.json`. Its sole job: keep the iOS
 * `associatedDomains` entitlement (universal links to suro.clotet.dev) out of
 * local builds.
 *
 * That entitlement requires a provisioning profile, so `expo run:ios` against
 * the simulator fails with "No code signing certificates are available." And
 * because `prebuild` rewrites `ios/Suro/Suro.entitlements` from the config on
 * every run, hand-editing the generated file never sticks — each fresh
 * workspace hits the wall again. Dropping it at the config level fixes it for
 * good locally.
 *
 * EAS builds set `EAS_BUILD=true` (this includes the local `eas build` used by
 * `build:ios:release`), so production builds keep the entitlement and universal
 * links still work in the shipped app.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const resolved = config as ExpoConfig;
  const isEasBuild = process.env.EAS_BUILD === "true";
  if (isEasBuild || !resolved.ios?.associatedDomains) {
    return resolved;
  }
  return {
    ...resolved,
    ios: { ...resolved.ios, associatedDomains: undefined },
  };
};
