// @ts-check
/**
 * Decides whether CI should trigger EAS native builds for a push to main.
 *
 * Builds only when all of the following are true:
 *   1. Root package.json version bumped vs the parent commit
 *   2. Top CHANGELOG.md entry matches that version
 *   3. Native-relevant files changed (app code, config, or mobile deps)
 *
 * Usage:
 *   node apps/mobile/scripts/should-build-native.mjs [before-sha] [after-sha]
 *
 * In GitHub Actions, set BEFORE_SHA / AFTER_SHA env vars instead. When
 * GITHUB_OUTPUT is set, writes `should_build` and `reason` outputs.
 */

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);
const MOBILE_PACKAGE_JSON = "apps/mobile/package.json";
const LOCKFILE = "pnpm-lock.yaml";

// Paths whose changes can require a new native binary. Store listing assets and
// auto-generated release notes are intentionally excluded.
const NATIVE_PATH_PREFIXES = [
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

const VERSION_HEADING = /^##\s+\[([^\]]+)\]\s*[—-]\s*(\d{4}-\d{2}-\d{2})\s*$/;

/**
 * @param {boolean} shouldBuild
 * @param {string} reason
 */
function finish(shouldBuild, reason) {
  const value = shouldBuild ? "true" : "false";
  console.log(`should_build=${value}`);
  console.log(`reason=${reason}`);

  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    appendFileSync(
      outputPath,
      `should_build=${value}\nreason=${reason.replaceAll("\n", " ")}\n`,
    );
  }

  process.exit(shouldBuild ? 0 : 0);
}

/**
 * @param {string} ref
 * @returns {string}
 */
function readFileAtRef(ref, path) {
  return execFileSync("git", ["show", `${ref}:${path}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

/**
 * @param {string} ref
 * @returns {string}
 */
function readVersionAtRef(ref) {
  return JSON.parse(readFileAtRef(ref, "package.json")).version;
}

/**
 * @param {string} markdown
 * @returns {string | null}
 */
function changelogTopVersionFromMarkdown(markdown) {
  for (const line of markdown.split("\n")) {
    const match = line.trim().match(VERSION_HEADING);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * @param {string} ref
 * @returns {string | null}
 */
function readChangelogTopVersionAtRef(ref) {
  return changelogTopVersionFromMarkdown(
    readFileAtRef(ref, "apps/web/CHANGELOG.md"),
  );
}

/**
 * @param {string} beforeSha
 * @param {string} afterSha
 * @returns {string[]}
 */
function changedFiles(beforeSha, afterSha) {
  const output = execFileSync(
    "git",
    ["diff", "--name-only", `${beforeSha}..${afterSha}`],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * @param {string} ref
 * @returns {string}
 */
function resolveCommit(ref) {
  return execFileSync("git", ["rev-parse", ref], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

/**
 * @param {string} ref
 * @returns {string}
 */
function shortSha(ref) {
  return resolveCommit(ref).slice(0, 7);
}

/**
 * @param {string} sha
 * @returns {boolean}
 */
function isValidCommit(sha) {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} afterSha
 * @returns {string}
 */
function resolveBeforeSha(afterSha) {
  const fromEnv = process.env.BEFORE_SHA;
  if (fromEnv && fromEnv !== "0000000000000000000000000000000000000000") {
    if (isValidCommit(fromEnv)) {
      return fromEnv;
    }
  }

  const fromArg = process.argv[2];
  if (fromArg) {
    return fromArg;
  }

  return execFileSync("git", ["rev-parse", `${afterSha}^`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

/**
 * @param {string} afterSha
 * @returns {string}
 */
function resolveAfterSha() {
  return (
    process.env.AFTER_SHA ??
    process.argv[3] ??
    execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim()
  );
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
function hasNativeRelevantChanges(files) {
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

const afterSha = resolveCommit(resolveAfterSha());
const beforeSha = resolveCommit(resolveBeforeSha(afterSha));

const previousVersion = readVersionAtRef(beforeSha);
const currentVersion = readVersionAtRef(afterSha);

if (previousVersion === currentVersion) {
  finish(
    false,
    `Skip: no version bump (${currentVersion} unchanged since ${shortSha(beforeSha)})`,
  );
}

const changelogVersion = readChangelogTopVersionAtRef(afterSha);
if (!changelogVersion) {
  finish(false, "Skip: no version entry found in apps/web/CHANGELOG.md");
}

if (changelogVersion !== currentVersion) {
  finish(
    false,
    `Skip: CHANGELOG top version ${changelogVersion} does not match package.json ${currentVersion}`,
  );
}

const files = changedFiles(beforeSha, afterSha);
if (!hasNativeRelevantChanges(files)) {
  finish(
    false,
    `Skip: version ${currentVersion} bumped but no native-relevant file changes between ${shortSha(beforeSha)} and ${shortSha(afterSha)}`,
  );
}

finish(
  true,
  `Build: release ${currentVersion} with native-relevant changes (${shortSha(beforeSha)}..${shortSha(afterSha)})`,
);
