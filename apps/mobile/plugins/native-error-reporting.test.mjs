import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { join } = require("node:path");
const { replaceNativeInit } = require("./native-error-reporting");

// The installed Expo/Sentry plugins are exercised by the prebuild check as well.
// These tests keep changed upstream startup markers from silently losing filters.
describe("native error reporting startup", () => {
  for (const [marker, filename] of [
    ["RNSentrySDK.init(this)", "android.kt"],
    ["RNSentrySDK.start()", "ios.swift"],
  ]) {
    it(`installs the ${filename} filter once`, () => {
      const template = readFileSync(
        join(import.meta.dirname, "native-error-reporting", filename),
        "utf8",
      );
      const output = replaceNativeInit(
        `before\n${marker}\nafter`,
        marker,
        template,
      );
      expect(output).toContain("0.0.0.0");
      expect(output).toContain("filtered.message = event.message");
      expect(output).toContain("filtered.debugMeta = event.debugMeta");
      expect(output).not.toContain("filtered.user = event.user");
      expect(replaceNativeInit(output, marker, template)).toBe(output);
    });
  }

  it("fails when native startup is missing or ambiguous", () => {
    expect(() =>
      replaceNativeInit("no startup", "init()", "replacement"),
    ).toThrow();
    expect(() =>
      replaceNativeInit("init(); init()", "init()", "replacement"),
    ).toThrow();
  });
});
