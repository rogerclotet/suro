#!/usr/bin/env node
/**
 * Validates i18n message catalogs:
 * 1. Every locale in a bundle has the same key tree (ca/en/es stay in sync).
 * 2. No empty string values (easy to miss when copying keys).
 *
 * TypeScript augmentation in apps/web/src/global.ts catches translation keys
 * referenced in web code that are missing from en.json (via `pnpm typecheck`).
 *
 * No dependencies — run with:  node scripts/check-i18n.mjs
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ label: string, dir: string }[]} */
const BUNDLES = [
  { label: "web", dir: join(ROOT, "apps/web/src/i18n/messages") },
  { label: "mobile", dir: join(ROOT, "apps/mobile/src/i18n/messages") },
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function ok(message) {
  console.log(`ok    ${message}`);
}

/**
 * @param {unknown} value
 * @param {string} prefix
 * @returns {string[]}
 */
function collectLeafPaths(value, prefix = "") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  /** @type {string[]} */
  const paths = [];
  for (const key of Object.keys(value).sort()) {
    const next = prefix ? `${prefix}.${key}` : key;
    paths.push(
      ...collectLeafPaths(
        /** @type {Record<string, unknown>} */ (value)[key],
        next,
      ),
    );
  }
  return paths;
}

/**
 * @param {unknown} value
 * @param {string} path
 */
function assertNonEmptyString(value, path) {
  if (typeof value !== "string") {
    return;
  }
  if (value.trim() === "") {
    fail(`${path} is an empty string`);
  }
}

/**
 * @param {unknown} value
 * @param {string} prefix
 */
function walkForEmptyStrings(value, prefix = "") {
  if (typeof value === "string") {
    assertNonEmptyString(value, prefix);
    return;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    walkForEmptyStrings(child, next);
  }
}

/**
 * @param {string} bundleLabel
 * @param {string} messagesDir
 */
function checkBundle(bundleLabel, messagesDir) {
  console.log(`\n== ${bundleLabel} (${messagesDir}) ==`);

  if (!existsSync(messagesDir)) {
    fail(`${bundleLabel}: messages directory not found`);
    return;
  }

  const localeFiles = readdirSync(messagesDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  if (localeFiles.length === 0) {
    fail(`${bundleLabel}: no locale JSON files found`);
    return;
  }

  /** @type {Map<string, string[]>} */
  const pathsByLocale = new Map();

  for (const file of localeFiles) {
    const locale = file.replace(/\.json$/, "");
    const filePath = join(messagesDir, file);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (e) {
      fail(
        `${bundleLabel}/${locale}: invalid JSON (${/** @type {Error} */ (e).message})`,
      );
      continue;
    }

    walkForEmptyStrings(parsed, `${bundleLabel}/${locale}`);
    pathsByLocale.set(locale, collectLeafPaths(parsed));
    ok(
      `${bundleLabel}/${locale}: ${pathsByLocale.get(locale)?.length ?? 0} leaf keys`,
    );
  }

  const [referenceLocale, referencePaths] =
    [...pathsByLocale.entries()][0] ?? [];
  if (!referenceLocale || !referencePaths) {
    return;
  }

  const referenceSet = new Set(referencePaths);

  for (const [locale, paths] of pathsByLocale.entries()) {
    if (locale === referenceLocale) {
      continue;
    }

    const localeSet = new Set(paths);

    for (const key of referenceSet) {
      if (!localeSet.has(key)) {
        fail(
          `${bundleLabel}/${locale}: missing key "${key}" (present in ${referenceLocale})`,
        );
      }
    }
    for (const key of localeSet) {
      if (!referenceSet.has(key)) {
        fail(
          `${bundleLabel}/${locale}: extra key "${key}" (missing from ${referenceLocale})`,
        );
      }
    }
  }

  ok(`${bundleLabel}: ${localeFiles.length} locales share the same key tree`);
}

for (const { label, dir } of BUNDLES) {
  checkBundle(label, dir);
}

if (failures > 0) {
  console.error(`\n${failures} i18n check(s) failed`);
  process.exit(1);
}

console.log("\nall i18n checks passed");
