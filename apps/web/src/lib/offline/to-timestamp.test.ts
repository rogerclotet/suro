/**
 * toTimestamp must accept Date fields in whichever shape they reach the client:
 * real Date objects from React Server Component props, or ISO strings after a
 * JSON round-trip (TanStack Query refetches, /api responses). Regression guard
 * for the production crash "createdAt?.getTime is not a function", which fired
 * when string-dated list data was seeded into IndexedDB.
 */

import { describe, expect, it } from "vitest";
import { toTimestamp } from "./to-timestamp";

describe("toTimestamp", () => {
  it("returns the timestamp for a Date", () => {
    const date = new Date("2026-01-15T10:30:00.000Z");
    expect(toTimestamp(date)).toBe(date.getTime());
  });

  it("parses an ISO string (the JSON round-trip case)", () => {
    const iso = "2026-01-15T10:30:00.000Z";
    expect(toTimestamp(iso)).toBe(new Date(iso).getTime());
  });

  it("passes through a numeric timestamp unchanged", () => {
    expect(toTimestamp(1_736_937_000_000)).toBe(1_736_937_000_000);
  });

  it("falls back to a current timestamp for null/undefined", () => {
    const before = Date.now();
    const result = toTimestamp(null);
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
    expect(toTimestamp(undefined)).toBeGreaterThanOrEqual(before);
  });
});
