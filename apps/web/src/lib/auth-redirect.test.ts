import { describe, expect, it } from "vitest";
import { buildLoginRedirect, getSafeRedirectTo } from "./auth-redirect";

describe("buildLoginRedirect", () => {
  it("preserves and encodes query strings", () => {
    expect(
      buildLoginRedirect("/grups/abc/calendari?d=2026-03-10&view=month"),
    ).toBe(
      "/login?to=%2Fgrups%2Fabc%2Fcalendari%3Fd%3D2026-03-10%26view%3Dmonth",
    );
  });

  it("falls back to the bare login page when no target is present", () => {
    expect(buildLoginRedirect("")).toBe("/login");
    expect(buildLoginRedirect(undefined)).toBe("/login");
  });
});

describe("getSafeRedirectTo", () => {
  it("allows relative in-app paths with search params", () => {
    expect(getSafeRedirectTo("/grups/abc/calendari?d=2026-03-10")).toBe(
      "/grups/abc/calendari?d=2026-03-10",
    );
  });

  it("rejects external or protocol-relative redirects", () => {
    expect(getSafeRedirectTo("https://example.com")).toBe("/");
    expect(getSafeRedirectTo("//example.com")).toBe("/");
  });
});
