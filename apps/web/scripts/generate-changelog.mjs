// @ts-check
/**
 * Parses the root CHANGELOG.md into a typed data module consumed by the app.
 *
 * Source format (a simplified Keep-a-Changelog variant carrying every locale):
 *
 *   ## [0.1.0] — 2026-05-29
 *
 *   ### ca
 *   - [feature] ...
 *
 *   ### es
 *   - [fix] ...
 *
 * Run via `pnpm changelog:generate` (also wired into postinstall/predev/prebuild).
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(REPO_ROOT, "CHANGELOG.md");
const OUTPUT = resolve(REPO_ROOT, "src/data/changelog.generated.ts");

// The monorepo root package.json is the release version of record: mobile
// app.config.ts reads it, and check-metadata.mjs pins store.config.json
// apple.version to it. Keep it in lockstep with the newest CHANGELOG entry so
// the in-app CURRENT_VERSION and the shipped store version can never drift.
// apps/web/package.json is not a source of truth, but tracks the same version
// so the version it reports stays correct.
const ROOT_PACKAGE_JSON = resolve(REPO_ROOT, "../..", "package.json");
const WEB_PACKAGE_JSON = resolve(REPO_ROOT, "package.json");

// Store "what's new" notes derive from the latest CHANGELOG entry so they never
// drift from the release.
const PLAY_CHANGELOG_DIR = resolve(
  REPO_ROOT,
  "../mobile/store/play/metadata/android",
);
const PLAY_LOCALES = { ca: "ca", es: "es-ES", en: "en-US" };
const PLAY_NOTE_MAX = 500; // Play per-language release-notes limit (see check-metadata.mjs)
const APPLE_STORE_CONFIG = resolve(REPO_ROOT, "../mobile/store.config.json");
const APPLE_LOCALES = { ca: "ca", es: "es-ES", en: "en-US" };
const APPLE_NOTE_MAX = 4000; // App Store per-language release-notes limit (see check-metadata.mjs)

const LOCALES = ["ca", "es", "en"];
const CHANGE_TYPES = ["feature", "fix", "improvement"];

// `## [0.1.0] — 2026-05-29` (em dash or hyphen separator).
const VERSION_HEADING = /^##\s+\[([^\]]+)\]\s*[—-]\s*(\d{4}-\d{2}-\d{2})\s*$/;
const LOCALE_HEADING = /^###\s+(\S+)\s*$/;
const CHANGE_BULLET = /^-\s+\[([^\]]+)\]\s+(.+?)\s*$/;

/**
 * @param {string} markdown
 * @returns {Array<{ version: string; date: string; changes: Record<string, Array<{ type: string; text: string }>> }>}
 */
function parseChangelog(markdown) {
  const lines = markdown.split("\n");
  const entries = [];
  /** @type {(typeof entries)[number] | null} */
  let currentEntry = null;
  /** @type {string | null} */
  let currentLocale = null;

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("# ")) return;

    const versionMatch = trimmed.match(VERSION_HEADING);
    if (versionMatch) {
      const [, version, date] = versionMatch;
      if (entries.some((entry) => entry.version === version)) {
        fail(lineNo, `duplicate version "${version}"`);
      }
      currentEntry = { version, date, changes: {} };
      currentLocale = null;
      entries.push(currentEntry);
      return;
    }

    const localeMatch = trimmed.match(LOCALE_HEADING);
    if (localeMatch) {
      const locale = localeMatch[1];
      if (!currentEntry)
        fail(lineNo, `locale "${locale}" before any version heading`);
      if (!LOCALES.includes(locale)) {
        fail(
          lineNo,
          `unknown locale "${locale}" (expected one of ${LOCALES.join(", ")})`,
        );
      }
      if (currentEntry.changes[locale]) {
        fail(
          lineNo,
          `duplicate locale "${locale}" in version "${currentEntry.version}"`,
        );
      }
      currentLocale = locale;
      currentEntry.changes[locale] = [];
      return;
    }

    const bulletMatch = trimmed.match(CHANGE_BULLET);
    if (bulletMatch) {
      const [, type, text] = bulletMatch;
      if (!currentEntry || !currentLocale) {
        fail(lineNo, "change bullet outside a version/locale section");
      }
      if (!CHANGE_TYPES.includes(type)) {
        fail(
          lineNo,
          `unknown change type "${type}" (expected one of ${CHANGE_TYPES.join(", ")})`,
        );
      }
      currentEntry.changes[currentLocale].push({ type, text });
      return;
    }

    // Anything before the first version heading is free-form preamble; ignore it.
    // Once entries have started, every line must be a recognized construct.
    if (!currentEntry) return;

    fail(lineNo, `unrecognized line: "${trimmed}"`);
  });

  if (entries.length === 0) fail(0, "no version entries found");
  return entries;
}

/**
 * @param {number} lineNo
 * @param {string} message
 * @returns {never}
 */
function fail(lineNo, message) {
  throw new Error(`CHANGELOG.md${lineNo ? `:${lineNo}` : ""} — ${message}`);
}

/**
 * @param {ReturnType<typeof parseChangelog>} entries
 */
function render(entries) {
  const currentVersion = entries[0].version;
  return `// AUTO-GENERATED from CHANGELOG.md by scripts/generate-changelog.mjs. Do not edit.
import type { Locale } from "@/i18n/routing";

export type ChangeType = "feature" | "fix" | "improvement";
export type Change = { type: ChangeType; text: string };
export type ChangelogEntry = {
  version: string;
  date: string;
  changes: Partial<Record<Locale, Change[]>>;
};

export const changelog: ChangelogEntry[] = ${JSON.stringify(entries, null, 2)};

export const CURRENT_VERSION = ${JSON.stringify(currentVersion)};
`;
}

/**
 * @param {Array<{ type: string; text: string }>} changes
 */
function formatReleaseNotes(changes) {
  return changes.map((change) => `• ${change.text}`).join("\n");
}

/**
 * Mirror the latest release's notes into the Play Store changelog files
 * (apps/mobile/store/play/metadata/android/<locale>/changelogs/default.txt),
 * one bullet per change, so Play "what's new" always matches the newest
 * CHANGELOG entry instead of a hand-maintained file. Skipped when the mobile
 * metadata tree is absent (e.g. a web-only build context).
 * @param {ReturnType<typeof parseChangelog>} entries
 */
async function writePlayChangelogs(entries) {
  if (!existsSync(PLAY_CHANGELOG_DIR)) {
    console.warn(
      `[changelog] Play metadata dir not found; skipping Play notes (${PLAY_CHANGELOG_DIR})`,
    );
    return;
  }
  const latest = entries[0];
  for (const [source, playLocale] of Object.entries(PLAY_LOCALES)) {
    const changes = latest.changes[source];
    if (!changes || changes.length === 0) {
      console.warn(
        `[changelog] No "${source}" notes for ${latest.version}; left Play ${playLocale} unchanged`,
      );
      continue;
    }
    const note = formatReleaseNotes(changes);
    if (note.length > PLAY_NOTE_MAX) {
      fail(
        0,
        `Play notes for ${playLocale} (${latest.version}) are ${note.length} chars, over Play's ${PLAY_NOTE_MAX} limit — shorten the CHANGELOG entry`,
      );
    }
    const dest = resolve(
      PLAY_CHANGELOG_DIR,
      playLocale,
      "changelogs",
      "default.txt",
    );
    await mkdir(dirname(dest), { recursive: true });
    // No trailing newline — Play counts the full file body toward the 500-char limit.
    await writeFile(dest, note, "utf8");
    console.log(
      `[changelog] Play notes -> ${playLocale}/changelogs/default.txt (${note.length}/${PLAY_NOTE_MAX} chars)`,
    );
  }
}

/**
 * Replace apple.info.<locale>.releaseNotes in store.config.json without
 * reformatting the rest of the file (Biome keeps categories on one line).
 * @param {string} text
 * @param {string} locale
 * @param {string} newNote
 */
function patchLocaleReleaseNotes(text, locale, newNote) {
  const localeMarker = `"${locale}":`;
  const localeIdx = text.indexOf(localeMarker);
  if (localeIdx === -1) {
    fail(0, `store.config.json missing locale ${locale}`);
  }
  const key = '"releaseNotes"';
  const keyIdx = text.indexOf(key, localeIdx);
  if (keyIdx === -1) {
    fail(0, `store.config.json missing ${locale}.releaseNotes`);
  }
  const colonIdx = text.indexOf(":", keyIdx);
  let valueStart = colonIdx + 1;
  while (valueStart < text.length && /[\s]/.test(text[valueStart])) {
    valueStart += 1;
  }
  if (text[valueStart] !== '"') {
    fail(0, `store.config.json ${locale}.releaseNotes is not a string`);
  }
  let i = valueStart + 1;
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === '"') break;
    i += 1;
  }
  const valueEnd = i + 1;
  return (
    text.slice(0, valueStart) + JSON.stringify(newNote) + text.slice(valueEnd)
  );
}

/**
 * Replace apple.version in store.config.json without reformatting the file.
 * EAS Metadata needs this to track the release version of record (root
 * package.json); check-metadata.mjs enforces the match.
 * @param {string} text
 * @param {string} newVersion
 */
function patchAppleVersion(text, newVersion) {
  const marker = '"apple"';
  const markerIdx = text.indexOf(marker);
  if (markerIdx === -1) {
    fail(0, `store.config.json missing "apple" block`);
  }
  const key = '"version"';
  const keyIdx = text.indexOf(key, markerIdx);
  if (keyIdx === -1) {
    fail(0, `store.config.json missing apple.version`);
  }
  const colonIdx = text.indexOf(":", keyIdx);
  let valueStart = colonIdx + 1;
  while (valueStart < text.length && /[\s]/.test(text[valueStart])) {
    valueStart += 1;
  }
  if (text[valueStart] !== '"') {
    fail(0, `store.config.json apple.version is not a string`);
  }
  let i = valueStart + 1;
  while (i < text.length && text[i] !== '"') {
    i += 1;
  }
  const valueEnd = i + 1;
  return (
    text.slice(0, valueStart) +
    JSON.stringify(newVersion) +
    text.slice(valueEnd)
  );
}

/**
 * Mirror the latest release into store.config.json: apple.version (the release
 * version of record) and apple.info.<locale>.releaseNotes (App Store "What's
 * New") for EAS Metadata. Skipped when the mobile store config is absent (e.g.
 * a web-only build context).
 * @param {ReturnType<typeof parseChangelog>} entries
 */
async function writeAppleStoreConfig(entries) {
  if (!existsSync(APPLE_STORE_CONFIG)) {
    console.warn(
      `[changelog] App Store config not found; skipping Apple metadata (${APPLE_STORE_CONFIG})`,
    );
    return;
  }
  const latest = entries[0];
  const original = await readFile(APPLE_STORE_CONFIG, "utf8");
  const config = JSON.parse(original);
  let updated = original;

  if (config.apple?.version !== latest.version) {
    updated = patchAppleVersion(updated, latest.version);
    console.log(
      `[changelog] store.config.json apple.version ${config.apple?.version} -> ${latest.version}`,
    );
  }

  for (const [source, appleLocale] of Object.entries(APPLE_LOCALES)) {
    const changes = latest.changes[source];
    if (!changes || changes.length === 0) {
      console.warn(
        `[changelog] No "${source}" notes for ${latest.version}; left App Store ${appleLocale} unchanged`,
      );
      continue;
    }
    const note = formatReleaseNotes(changes);
    if (note.length > APPLE_NOTE_MAX) {
      fail(
        0,
        `App Store notes for ${appleLocale} (${latest.version}) are ${note.length} chars, over Apple's ${APPLE_NOTE_MAX} limit — shorten the CHANGELOG entry`,
      );
    }
    const info = config.apple?.info?.[appleLocale];
    if (!info) {
      fail(
        0,
        `store.config.json missing apple.info.${appleLocale} — add the locale before generating release notes`,
      );
    }
    if (info.releaseNotes !== note) {
      updated = patchLocaleReleaseNotes(updated, appleLocale, note);
      console.log(
        `[changelog] App Store notes -> apple.info.${appleLocale}.releaseNotes (${note.length}/${APPLE_NOTE_MAX} chars)`,
      );
    }
  }

  if (updated === original) {
    console.log("[changelog] App Store metadata already up to date");
    return;
  }
  await writeFile(APPLE_STORE_CONFIG, updated, "utf8");
}

/**
 * Sync a package.json version to the newest CHANGELOG entry. Patches only the
 * version string so the rest of the file is left untouched.
 * @param {string} path
 * @param {string} label
 * @param {string} latest
 */
async function syncPackageVersion(path, label, latest) {
  const original = await readFile(path, "utf8");
  const match = original.match(/"version":\s*"([^"]+)"/);
  if (!match) {
    fail(0, `${label} package.json (${path}) has no "version" field`);
  }
  const current = match[1];
  if (current === latest) {
    console.log(`[changelog] ${label} package.json version already ${latest}`);
    return;
  }
  const updated = original.replace(
    match[0],
    `"version": ${JSON.stringify(latest)}`,
  );
  await writeFile(path, updated, "utf8");
  console.log(
    `[changelog] ${label} package.json version ${current} -> ${latest}`,
  );
}

/**
 * Keep the release version of record (root package.json) and the tracking
 * apps/web/package.json in lockstep with the newest CHANGELOG entry.
 * @param {ReturnType<typeof parseChangelog>} entries
 */
async function writePackageVersions(entries) {
  const latest = entries[0].version;
  await syncPackageVersion(ROOT_PACKAGE_JSON, "Root", latest);
  await syncPackageVersion(WEB_PACKAGE_JSON, "apps/web", latest);
}

async function main() {
  const markdown = await readFile(SOURCE, "utf8");
  const entries = parseChangelog(markdown);
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, render(entries), "utf8");
  console.log(
    `[changelog] Generated ${OUTPUT} (${entries.length} version(s)).`,
  );
  await writePackageVersions(entries);
  await writePlayChangelogs(entries);
  await writeAppleStoreConfig(entries);
}

main().catch((error) => {
  console.error(
    `[changelog] ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
});
