import { describe, expect, it } from "vitest";
import { isAllowedWebOriginWithAllowlist } from "./allowedWebOrigins";

const DEV_ALLOWLIST = "http://localhost:3000,https://*.suro.clotet.dev";
const PROD_ALLOWLIST =
  "https://suroapp.cat,https://suro.clotet.dev,https://*.suro.clotet.dev";

describe("isAllowedWebOrigin", () => {
  it("allows any localhost port when a localhost entry is on the allowlist", () => {
    expect(
      isAllowedWebOriginWithAllowlist("http://localhost:55000/", DEV_ALLOWLIST),
    ).toBe(true);
    expect(
      isAllowedWebOriginWithAllowlist("http://127.0.0.1:55000/", DEV_ALLOWLIST),
    ).toBe(true);
  });

  it("allows explicit localhost port wildcards", () => {
    expect(
      isAllowedWebOriginWithAllowlist(
        "http://localhost:55000/",
        "http://localhost:*",
      ),
    ).toBe(true);
    expect(
      isAllowedWebOriginWithAllowlist(
        "http://127.0.0.1:8080/",
        "http://127.0.0.1:*",
      ),
    ).toBe(true);
  });

  it("allows bare localhost entries on any port", () => {
    expect(
      isAllowedWebOriginWithAllowlist(
        "http://localhost:55000/",
        "http://localhost",
      ),
    ).toBe(true);
  });

  it("matches preview subdomains", () => {
    expect(
      isAllowedWebOriginWithAllowlist(
        "https://mr-12.suro.clotet.dev/groups",
        DEV_ALLOWLIST,
      ),
    ).toBe(true);
  });

  it("rejects localhost on prod allowlists", () => {
    expect(
      isAllowedWebOriginWithAllowlist(
        "http://localhost:55000/",
        PROD_ALLOWLIST,
      ),
    ).toBe(false);
  });

  it("rejects invalid or external origins", () => {
    expect(isAllowedWebOriginWithAllowlist("not-a-url", DEV_ALLOWLIST)).toBe(
      false,
    );
    expect(
      isAllowedWebOriginWithAllowlist(
        "https://evil.example.com/",
        DEV_ALLOWLIST,
      ),
    ).toBe(false);
  });
});
