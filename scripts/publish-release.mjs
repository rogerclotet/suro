#!/usr/bin/env node
// @ts-check
/**
 * Tags a version bump on main and publishes the matching GitHub release.
 *
 * The root package.json version is the release version of record (see
 * apps/web/scripts/generate-changelog.mjs). When a push to main changes it,
 * this tags the commit `v<version>` and creates a release whose notes are the
 * CHANGELOG.md entry for that version. A no-op when the version is unchanged
 * or the tag already exists, so re-running a CI job is safe.
 *
 * Usage:  node scripts/publish-release.mjs [before-sha] [after-sha] [--dry-run]
 * In GitHub Actions, set BEFORE_SHA / AFTER_SHA (and GH_TOKEN for `gh`).
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CHANGELOG = join(REPO_ROOT, "apps/web/CHANGELOG.md");
const VERSION_HEADING = /^##\s+\[([^\]]+)\]\s*[—-]\s*(\d{4}-\d{2}-\d{2})\s*$/;

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {string}
 */
function run(command, args) {
  return execFileSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

/** @param {string} ref */
function versionAtRef(ref) {
  const json = run("git", ["show", `${ref}:package.json`]);
  const { version } = JSON.parse(json);
  if (typeof version !== "string") {
    throw new Error(`No version in package.json at ${ref}`);
  }
  return version;
}

/** @param {string} ref */
function refExists(ref) {
  try {
    run("git", ["cat-file", "-e", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * The CHANGELOG body for a version — everything under its heading, up to the
 * next one. Returns null when the version has no entry (e.g. a bump that
 * predates the changelog).
 * @param {string} version
 */
function changelogBody(version) {
  const lines = readFileSync(CHANGELOG, "utf8").split("\n");
  const start = lines.findIndex((line) => {
    const match = line.match(VERSION_HEADING);
    return match?.[1] === version;
  });
  if (start === -1) return null;

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => VERSION_HEADING.test(line));
  const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  return body.length > 0 ? body : null;
}

/** @param {string} tag */
function tagExists(tag) {
  return run("git", ["tag", "--list", tag]).length > 0;
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--dry-run");
  const dryRun = process.argv.includes("--dry-run");
  const beforeSha = args[0] ?? process.env.BEFORE_SHA ?? "";
  const afterSha = args[1] ?? process.env.AFTER_SHA ?? "HEAD";

  if (!beforeSha || /^0+$/.test(beforeSha) || !refExists(beforeSha)) {
    console.log(`No usable parent commit (${beforeSha || "unset"}); skipping`);
    return;
  }

  const version = versionAtRef(afterSha);
  if (versionAtRef(beforeSha) === version) {
    console.log(`Version unchanged at ${version}; nothing to release`);
    return;
  }

  const tag = `v${version}`;
  if (tagExists(tag)) {
    console.log(`Tag ${tag} already exists; nothing to release`);
    return;
  }

  const body = changelogBody(version);
  if (!body) {
    throw new Error(
      `No CHANGELOG.md entry for ${version} — add one before releasing`,
    );
  }

  if (dryRun) {
    console.log(`Would publish ${tag} at ${afterSha}:\n\n${body}`);
    return;
  }

  const notesFile = join(mkdtempSync(join(tmpdir(), "release-")), "notes.md");
  writeFileSync(notesFile, `${body}\n`, "utf8");

  run("gh", [
    "release",
    "create",
    tag,
    "--target",
    afterSha,
    "--title",
    tag,
    "--notes-file",
    notesFile,
  ]);
  console.log(`Published ${tag}`);
}

main();
