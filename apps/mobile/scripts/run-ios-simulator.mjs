/**
 * Local iOS simulator dev entrypoint. Prebuilds with simulator-safe config,
 * strips Sign-in-with-Apple from entitlements (autolinking adds it back even
 * when the plugin is removed), then runs `expo run:ios`.
 *
 * Pass through simulator selection when a physical device is plugged in, e.g.:
 *   pnpm --filter mobile ios -- --device "iPhone 17"
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const mobileRoot = resolve(import.meta.dirname, "..");
const env = {
  ...process.env,
  LOCAL_IOS_SIM_BUILD: "1",
  PATH: `/usr/bin:${process.env.PATH ?? ""}`,
};
const runArgs = process.argv.slice(2);
const iosDir = resolve(mobileRoot, "ios");

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: mobileRoot,
    env: { ...env, ...extraEnv },
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(iosDir)) {
  run("npx", ["expo", "prebuild", "--platform", "ios"]);
}

run("node", ["scripts/prepare-ios-simulator.mjs"]);
run("npx", ["expo", "run:ios", "--no-install", ...runArgs]);
