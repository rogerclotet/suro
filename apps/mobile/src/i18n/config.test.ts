import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALES,
  MESSAGES,
  normalizeLocale,
} from "./config";

describe("normalizeLocale", () => {
  it("falls back to the default locale for missing values", () => {
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("")).toBe(DEFAULT_LOCALE);
  });

  it("passes through supported locales unchanged", () => {
    expect(normalizeLocale("ca")).toBe("ca");
    expect(normalizeLocale("es")).toBe("es");
    expect(normalizeLocale("en")).toBe("en");
  });

  it("matches on the language subtag of a regional tag", () => {
    expect(normalizeLocale("en-GB")).toBe("en");
    expect(normalizeLocale("es_ES")).toBe("es");
    expect(normalizeLocale("ca-ES")).toBe("ca");
  });

  it("is case-insensitive on the language subtag", () => {
    expect(normalizeLocale("EN")).toBe("en");
    expect(normalizeLocale("ES-mx")).toBe("es");
  });

  it("falls back to the default for unsupported languages", () => {
    expect(normalizeLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("de-DE")).toBe(DEFAULT_LOCALE);
  });
});

describe("locale catalog", () => {
  it("defaults to Catalan and exposes a label per locale", () => {
    expect(DEFAULT_LOCALE).toBe("ca");
    expect(LOCALES).toEqual(["ca", "es", "en"]);
    for (const locale of LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    }
  });
});

// Collect every leaf key path (e.g. "mobile.calendar.timeRemainingDays") so we
// can assert the three message catalogs stay in lockstep — a missing or extra
// key in any locale is a real bug the app relies on never happening.
function leafPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) {
    return [prefix];
  }
  return Object.entries(obj).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalog parity", () => {
  const reference = leafPaths(MESSAGES.en).sort();

  for (const locale of LOCALES) {
    it(`${locale} has exactly the same keys as en`, () => {
      expect(leafPaths(MESSAGES[locale]).sort()).toEqual(reference);
    });
  }
});
