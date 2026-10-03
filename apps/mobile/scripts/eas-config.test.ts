import { describe, expect, it } from "vitest";
import easConfig from "../eas.json";

describe("EAS build configuration", () => {
  it("has no empty environment values in any profile, including unused profiles", () => {
    for (const [profileName, profile] of Object.entries(easConfig.build)) {
      for (const [key, value] of Object.entries(profile.env)) {
        expect(value, `build.${profileName}.env.${key}`).not.toBe("");
      }
    }
  });
});
