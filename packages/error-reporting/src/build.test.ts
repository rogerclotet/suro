import { describe, expect, it } from "vitest";
import {
  currentRelease,
  releaseForCommit,
  requireUploadConfig,
} from "../build.mjs";

describe("release builds", () => {
  it("uses exactly seven characters from the deployed commit", () => {
    expect(releaseForCommit("abcdef0123456789abcdef0123456789abcdef01")).toBe(
      "suro@abcdef0",
    );
    expect(
      currentRelease({ SURO_COMMIT_SHA: "123456789", GITHUB_SHA: "987654321" }),
    ).toBe("suro@1234567");
    expect(currentRelease({ EAS_BUILD_GIT_COMMIT_HASH: "abcdef0123" })).toBe(
      "suro@abcdef0",
    );
    expect(() => releaseForCommit("unknown")).toThrow();
  });

  it("rejects missing credentials and upload failure bypasses", () => {
    const env = {
      SENTRY_URL: "https://errors.example.com",
      SENTRY_ORG: "suro",
      SENTRY_PROJECT: "suro",
      SENTRY_AUTH_TOKEN: "test",
    };
    expect(() => requireUploadConfig(env)).not.toThrow();
    for (const key of Object.keys(env)) {
      expect(() => requireUploadConfig({ ...env, [key]: "" })).toThrow(key);
    }
    expect(() =>
      requireUploadConfig({ ...env, SENTRY_ALLOW_FAILURE: "true" }),
    ).toThrow(/bypassed/);
    expect(() =>
      requireUploadConfig({ ...env, SENTRY_DISABLE_AUTO_UPLOAD: "true" }),
    ).toThrow(/bypassed/);
  });
});
