import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { convexSiteUrl, webUrl } from "./urls";

// These helpers read EXPO_PUBLIC_* from process.env at call time, so save and
// restore the originals around each test rather than relying on build-time
// inlining.
const ENV_KEYS = ["EXPO_PUBLIC_SITE_URL", "EXPO_PUBLIC_CONVEX_URL"] as const;
const original: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    original[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("webUrl", () => {
  it("falls back to the production site when unset", () => {
    expect(webUrl("/groups/abc")).toBe("https://suro.clotet.dev/groups/abc");
  });

  it("uses the configured site base", () => {
    process.env.EXPO_PUBLIC_SITE_URL = "https://example.com";
    expect(webUrl("/path")).toBe("https://example.com/path");
  });

  it("strips a trailing slash from the configured base", () => {
    process.env.EXPO_PUBLIC_SITE_URL = "https://example.com/";
    expect(webUrl("/path")).toBe("https://example.com/path");
  });
});

describe("convexSiteUrl", () => {
  it("returns an empty string when the deployment URL is unset", () => {
    expect(convexSiteUrl()).toBe("");
  });

  it("swaps the .convex.cloud API host for the .convex.site host", () => {
    process.env.EXPO_PUBLIC_CONVEX_URL = "https://happy-otter-123.convex.cloud";
    expect(convexSiteUrl()).toBe("https://happy-otter-123.convex.site");
  });

  it("only rewrites the trailing .convex.cloud suffix", () => {
    process.env.EXPO_PUBLIC_CONVEX_URL = "https://self-hosted.example.com";
    expect(convexSiteUrl()).toBe("https://self-hosted.example.com");
  });
});
