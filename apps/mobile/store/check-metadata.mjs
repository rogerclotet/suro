#!/usr/bin/env node
/**
 * Lints the committed store metadata against the stores' hard limits, so a
 * copy tweak can't silently break an `eas metadata:push` or a Play Console
 * upload. No dependencies — run with:  node apps/mobile/store/check-metadata.mjs
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const STORE_DIR = dirname(fileURLToPath(import.meta.url));
const MOBILE_DIR = join(STORE_DIR, "..");

const LOCALES = ["en-US", "es-ES", "ca"];

// Apple: 6.9" (iPhone 16/17 Pro Max) and 6.7" (15 Pro Max era) portrait sizes
// are accepted for the single required iPhone screenshot set.
const APPLE_SCREENSHOT_SIZES = [
  [1320, 2868],
  [1290, 2796],
];

let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function check(condition, okMessage, failMessage) {
  if (condition) {
    console.log(`ok    ${okMessage}`);
  } else {
    fail(failMessage);
  }
}

function checkLength(value, max, label) {
  check(
    typeof value === "string" && value.length > 0 && value.length <= max,
    `${label} (${value?.length ?? 0}/${max})`,
    `${label} is ${value?.length ?? 0} chars (limit ${max})`,
  );
}

/** Minimal PNG IHDR parse — returns [width, height]. */
function pngSize(path) {
  const buf = readFileSync(path);
  const isPng =
    buf.length > 24 &&
    buf.readUInt32BE(0) === 0x89504e47 &&
    buf.toString("ascii", 12, 16) === "IHDR";
  if (!isPng) {
    throw new Error(`${path} is not a PNG`);
  }
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function checkAppleConfig() {
  console.log("\n== App Store (store.config.json) ==");
  const config = JSON.parse(
    readFileSync(join(MOBILE_DIR, "store.config.json"), "utf8"),
  );

  // EAS Metadata needs an explicit `version` to resolve the App Store version
  // it writes to (auto-detection feeds an empty versionString before a build
  // exists). It must track the release version of record — the monorepo root
  // package.json, the same source app.config.ts reads — or the push targets the
  // wrong version.
  const { version: appVersion } = JSON.parse(
    readFileSync(join(MOBILE_DIR, "..", "..", "package.json"), "utf8"),
  );
  const configVersion = config.apple?.version;
  check(
    configVersion === appVersion,
    `apple.version ${configVersion} matches root package.json`,
    `store.config.json apple.version is ${configVersion}, expected ${appVersion} (root package.json) — bump it in lockstep`,
  );

  const info = config.apple?.info ?? {};
  for (const locale of LOCALES) {
    const entry = info[locale];
    if (entry === undefined) {
      fail(`store.config.json missing locale ${locale}`);
      continue;
    }
    checkLength(entry.title, 30, `[${locale}] title`);
    checkLength(entry.subtitle, 30, `[${locale}] subtitle`);
    checkLength(entry.promoText, 170, `[${locale}] promoText`);
    checkLength(entry.description, 4000, `[${locale}] description`);
    checkLength(entry.releaseNotes, 4000, `[${locale}] releaseNotes`);
    const keywords = (entry.keywords ?? []).join(",");
    checkLength(keywords, 100, `[${locale}] keywords (joined)`);
  }
}

function checkAppleScreenshots() {
  console.log("\n== App Store screenshots (store/apple/screenshots) ==");
  for (const locale of LOCALES) {
    const dir = join(STORE_DIR, "apple", "screenshots", locale);
    const shots = existsSync(dir)
      ? readdirSync(dir).filter((name) => name.endsWith(".png"))
      : [];
    check(
      shots.length >= 1 && shots.length <= 10,
      `[${locale}] ${shots.length} screenshot(s)`,
      `[${locale}] has ${shots.length} screenshots (App Store needs 1-10)`,
    );
    for (const shot of shots) {
      const [width, height] = pngSize(join(dir, shot));
      check(
        APPLE_SCREENSHOT_SIZES.some(([w, h]) => w === width && h === height),
        `[${locale}] ${shot} ${width}x${height}`,
        `[${locale}] ${shot} is ${width}x${height} (expected ${APPLE_SCREENSHOT_SIZES.map(([w, h]) => `${w}x${h}`).join(" or ")})`,
      );
    }
  }
}

function checkPlay() {
  console.log("\n== Play Store (store/play/metadata/android) ==");
  for (const locale of LOCALES) {
    const dir = join(STORE_DIR, "play", "metadata", "android", locale);
    const read = (name) => readFileSync(join(dir, name), "utf8").trimEnd();
    checkLength(read("title.txt"), 30, `[${locale}] title.txt`);
    checkLength(
      read("short_description.txt"),
      80,
      `[${locale}] short_description.txt`,
    );
    checkLength(
      read("full_description.txt"),
      4000,
      `[${locale}] full_description.txt`,
    );
    checkLength(
      read(join("changelogs", "default.txt")),
      500,
      `[${locale}] changelogs/default.txt`,
    );

    const featureGraphic = join(dir, "images", "featureGraphic.png");
    const [fgWidth, fgHeight] = pngSize(featureGraphic);
    check(
      fgWidth === 1024 && fgHeight === 500,
      `[${locale}] featureGraphic.png 1024x500`,
      `[${locale}] featureGraphic.png is ${fgWidth}x${fgHeight} (must be 1024x500)`,
    );

    const shotsDir = join(dir, "images", "phoneScreenshots");
    const shots = existsSync(shotsDir)
      ? readdirSync(shotsDir).filter((name) => name.endsWith(".png"))
      : [];
    check(
      shots.length >= 2 && shots.length <= 8,
      `[${locale}] ${shots.length} phone screenshot(s)`,
      `[${locale}] has ${shots.length} phone screenshots (Play needs 2-8)`,
    );
    for (const shot of shots) {
      const [width, height] = pngSize(join(shotsDir, shot));
      const sidesOk =
        Math.min(width, height) >= 320 && Math.max(width, height) <= 3840;
      check(
        sidesOk,
        `[${locale}] ${shot} ${width}x${height}`,
        `[${locale}] ${shot} is ${width}x${height} (each side must be 320-3840)`,
      );
    }
  }

  const icon = join(
    STORE_DIR,
    "play",
    "metadata",
    "android",
    "en-US",
    "images",
    "icon.png",
  );
  const [iconWidth, iconHeight] = pngSize(icon);
  check(
    iconWidth === 512 && iconHeight === 512,
    "icon.png 512x512",
    `icon.png is ${iconWidth}x${iconHeight} (must be 512x512)`,
  );
}

checkAppleConfig();
checkAppleScreenshots();
checkPlay();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall store metadata checks passed");
