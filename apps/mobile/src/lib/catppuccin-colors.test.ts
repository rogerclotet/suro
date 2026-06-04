import { describe, expect, it } from "vitest";
import {
  CATPPUCCIN_COLOR_KEYS,
  CATPPUCCIN_COLORS,
  catppuccinSwatch,
} from "./catppuccin-colors";

describe("CATPPUCCIN_COLOR_KEYS", () => {
  it("lists every palette key in display order", () => {
    expect(CATPPUCCIN_COLOR_KEYS).toHaveLength(14);
    expect(CATPPUCCIN_COLOR_KEYS[0]).toBe("rosewater");
    expect(CATPPUCCIN_COLOR_KEYS.at(-1)).toBe("lavender");
    expect(CATPPUCCIN_COLOR_KEYS).toEqual(Object.keys(CATPPUCCIN_COLORS));
  });

  it("maps each key to a dark-on-pastel swatch", () => {
    for (const key of CATPPUCCIN_COLOR_KEYS) {
      const swatch = catppuccinSwatch(key);
      expect(swatch?.bg).toMatch(/^#[0-9a-f]{6}$/);
      expect(swatch?.fg).toBe("#1e1e2e");
    }
  });
});

describe("catppuccinSwatch", () => {
  it("resolves a known color name to its swatch", () => {
    expect(catppuccinSwatch("blue")).toEqual({ bg: "#89b4fa", fg: "#1e1e2e" });
  });

  it("returns undefined for unset values", () => {
    expect(catppuccinSwatch(null)).toBeUndefined();
    expect(catppuccinSwatch(undefined)).toBeUndefined();
    expect(catppuccinSwatch("")).toBeUndefined();
  });

  it("returns undefined for an unknown color name", () => {
    expect(catppuccinSwatch("chartreuse")).toBeUndefined();
  });
});
