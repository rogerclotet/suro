import { execFileSync } from "node:child_process";

export function releaseForCommit(sha) {
  if (!/^[a-f0-9]{7,40}$/.test(sha ?? "")) {
    throw new Error("Error reporting requires a Git commit SHA");
  }
  return `suro@${sha.slice(0, 7)}`;
}

export function currentRelease(env = process.env) {
  const sha =
    env.SURO_COMMIT_SHA ||
    env.EAS_BUILD_GIT_COMMIT_HASH ||
    env.GITHUB_SHA ||
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  return releaseForCommit(sha);
}

export function requireUploadConfig(env = process.env) {
  for (const key of [
    "SENTRY_URL",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "SENTRY_AUTH_TOKEN",
  ]) {
    if (!env[key])
      throw new Error(`Production error reporting requires ${key}`);
  }
  const url = new URL(env.SENTRY_URL);
  if (url.protocol !== "https:") throw new Error("SENTRY_URL must use HTTPS");
  if (
    env.SENTRY_ALLOW_FAILURE === "true" ||
    env.SENTRY_DISABLE_AUTO_UPLOAD === "true"
  ) {
    throw new Error("Production sourcemap uploads must not be bypassed");
  }
}
