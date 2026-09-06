import { describe, expect, it } from "vitest";
import { hasNativeRelevantChanges } from "./native-release-paths";

describe("native release inputs", () => {
  it.each(["design-tokens", "domain"])(
    "builds releases when the shared %s package changes",
    (name) => {
      expect(
        hasNativeRelevantChanges([
          `packages/${name}/src/index.ts`,
          "package.json",
          "apps/web/CHANGELOG.md",
          "apps/mobile/store.config.json",
        ]),
      ).toBe(true);
    },
  );

  it("does not build for backend-only or store-listing changes", () => {
    expect(
      hasNativeRelevantChanges([
        "packages/backend/convex/events.ts",
        "apps/mobile/store.config.json",
        "apps/web/CHANGELOG.md",
        "pnpm-lock.yaml",
      ]),
    ).toBe(false);
  });

  it("builds for mobile source and dependency changes", () => {
    expect(hasNativeRelevantChanges(["apps/mobile/src/ui.tsx"])).toBe(true);
    expect(hasNativeRelevantChanges(["apps/mobile/package.json"])).toBe(true);
  });
});
