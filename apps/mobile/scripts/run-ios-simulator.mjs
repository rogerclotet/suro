/**
 * Local iOS simulator dev entrypoint. Prebuilds with simulator-safe config,
 * strips Sign-in-with-Apple from entitlements (autolinking adds it back even
 * when the plugin is removed), then runs `expo run:ios`.
 *
 * Defaults to the "iPhone 17" simulator so a plugged-in physical device
 * (e.g. Apollo) isn't picked instead. Override with:
 *   pnpm --filter mobile ios -- --device "iPhone 17 Pro Max"
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const mobileRoot = resolve(import.meta.dirname, "..");
const defaultSimulator = "iPhone 17";
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

function hasDeviceArg(args) {
  return args.some(
    (arg, index) =>
      arg === "--device" ||
      arg === "-d" ||
      args[index - 1] === "--device" ||
      args[index - 1] === "-d",
  );
}

if (!existsSync(iosDir)) {
  run("npx", ["expo", "prebuild", "--platform", "ios"]);
}

run("node", ["scripts/prepare-ios-simulator.mjs"]);

const deviceArgs = hasDeviceArg(runArgs)
  ? runArgs
  : ["--device", defaultSimulator, ...runArgs];

run("npx", ["expo", "run:ios", ...deviceArgs]);
