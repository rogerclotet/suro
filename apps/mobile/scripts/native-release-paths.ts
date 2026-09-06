const MOBILE_PACKAGE_JSON = "apps/mobile/package.json";
const LOCKFILE = "pnpm-lock.yaml";

// Paths whose changes can require a new native binary. Store listing assets and
// auto-generated release notes are intentionally excluded.
const NATIVE_PATH_PREFIXES = [
  "packages/design-tokens/",
  "packages/domain/",
  "apps/mobile/src/",
  "apps/mobile/assets/",
  "apps/mobile/plugins/",
  "apps/mobile/app.json",
  "apps/mobile/app.config.ts",
  "apps/mobile/eas.json",
  "apps/mobile/package.json",
  "apps/mobile/metro.config.js",
  "apps/mobile/google-services.json",
];

export function hasNativeRelevantChanges(files: string[]) {
  const mobilePackageChanged = files.includes(MOBILE_PACKAGE_JSON);
  const lockfileChanged = files.includes(LOCKFILE);

  for (const file of files) {
    if (file === LOCKFILE) {
      continue;
    }
    if (NATIVE_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))) {
      return true;
    }
  }

  return mobilePackageChanged && lockfileChanged;
}
