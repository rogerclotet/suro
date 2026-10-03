import { spawnSync } from "node:child_process";
import { currentRelease } from "error-reporting/build";

const result = spawnSync("eas", ["build", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, SENTRY_RELEASE: currentRelease() },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
