import { describe, expect, it } from "vitest";
import { isAllowedAppRedirectWithSchemes } from "./allowedAppSchemes";

const PROD_SCHEMES = "suro";
const DEV_SCHEMES = "suro, surodev, exp";

describe("isAllowedAppRedirect", () => {
  it("accepts only the released app's scheme in production", () => {
    expect(isAllowedAppRedirectWithSchemes("suro://", PROD_SCHEMES)).toBe(true);
    expect(
      isAllowedAppRedirectWithSchemes("suro://callback?x=1", PROD_SCHEMES),
    ).toBe(true);
  });

  it("rejects Expo Go and the dev variant unless the deployment opts in", () => {
    for (const redirectTo of ["exp://192.168.1.2:8081/--/", "surodev://"]) {
      expect(isAllowedAppRedirectWithSchemes(redirectTo, PROD_SCHEMES)).toBe(
        false,
      );
      expect(isAllowedAppRedirectWithSchemes(redirectTo, DEV_SCHEMES)).toBe(
        true,
      );
    }
  });

  it("matches the whole scheme, not a prefix of it", () => {
    expect(isAllowedAppRedirectWithSchemes("surodev://", PROD_SCHEMES)).toBe(
      false,
    );
    expect(isAllowedAppRedirectWithSchemes("suro-evil://", PROD_SCHEMES)).toBe(
      false,
    );
    expect(isAllowedAppRedirectWithSchemes("SURO://", PROD_SCHEMES)).toBe(true);
  });

  it("never treats a web URL or a path as an app link", () => {
    const schemes = "suro,http,https";
    for (const redirectTo of [
      "https://evil.example/",
      "http://localhost:3000/",
      "/groups",
      "?code=1",
      "suro:evil",
      "",
    ]) {
      expect(isAllowedAppRedirectWithSchemes(redirectTo, schemes)).toBe(false);
    }
  });

  it("accepts nothing when the list is empty", () => {
    expect(isAllowedAppRedirectWithSchemes("suro://", "")).toBe(false);
  });
});
