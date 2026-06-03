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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(REPO_ROOT, "CHANGELOG.md");
const OUTPUT = resolve(REPO_ROOT, "src/data/changelog.generated.ts");

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

async function main() {
  const markdown = await readFile(SOURCE, "utf8");
  const entries = parseChangelog(markdown);
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, render(entries), "utf8");
  console.log(
    `[changelog] Generated ${OUTPUT} (${entries.length} version(s)).`,
  );
}

main().catch((error) => {
  console.error(
    `[changelog] ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
});
