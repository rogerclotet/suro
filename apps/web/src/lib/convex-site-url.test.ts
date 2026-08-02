import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { convexSiteUrl } from "./convex-site-url";

const original = process.env.NEXT_PUBLIC_CONVEX_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_CONVEX_URL;
});

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
  } else {
    process.env.NEXT_PUBLIC_CONVEX_URL = original;
  }
});

describe("convexSiteUrl", () => {
  it("returns an empty string when the deployment URL is unset", () => {
    expect(convexSiteUrl()).toBe("");
  });

  it("swaps the .convex.cloud API host for the .convex.site host", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://happy-otter-123.convex.cloud";
    expect(convexSiteUrl()).toBe("https://happy-otter-123.convex.site");
  });
});
