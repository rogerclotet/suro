import { describe, expect, it } from "vitest";
import {
  advanceDueAt,
  presetForRecurrence,
  type Recurrence,
  recurrenceForPreset,
} from "./recurrence";

// Mirrors the backend's `advanceDueAt`; these cases pin the behaviors the
// server reschedule-on-complete relies on so the offline overlay stays in sync.

const utc = (y: number, mo: number, d: number, h = 0, mi = 0): number =>
  Date.UTC(y, mo, d, h, mi);

describe("advanceDueAt", () => {
  it("steps daily by the interval", () => {
    const due = utc(2026, 0, 10);
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, 0)).toBe(
      utc(2026, 0, 11),
    );
    expect(advanceDueAt(due, { freq: "daily", interval: 3 }, 0)).toBe(
      utc(2026, 0, 13),
    );
  });

  it("steps weekly in 7-day multiples", () => {
    const due = utc(2026, 0, 10);
    expect(advanceDueAt(due, { freq: "weekly", interval: 1 }, 0)).toBe(
      utc(2026, 0, 17),
    );
    expect(advanceDueAt(due, { freq: "weekly", interval: 2 }, 0)).toBe(
      utc(2026, 0, 24),
    );
  });

  it("keeps day-of-month and clamps short months (Jan 31 -> Feb 28)", () => {
    const due = utc(2026, 0, 31); // 2026 is not a leap year
    expect(advanceDueAt(due, { freq: "monthly", interval: 1 }, 0)).toBe(
      utc(2026, 1, 28),
    );
  });

  it("steps yearly and clamps Feb 29 onto a non-leap year", () => {
    const due = utc(2024, 1, 29); // leap day
    expect(advanceDueAt(due, { freq: "yearly", interval: 1 }, 0)).toBe(
      utc(2025, 1, 28),
    );
  });

  it("preserves the time-of-day component when stepping", () => {
    const due = utc(2026, 0, 10, 13, 30);
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, 0)).toBe(
      utc(2026, 0, 11, 13, 30),
    );
  });

  it("rolls forward past `now` to the next future occurrence", () => {
    const due = utc(2026, 0, 1);
    const now = utc(2026, 0, 5, 12);
    // Daily from Jan 1, skipping every occurrence up to and including `now`.
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, now)).toBe(
      utc(2026, 0, 6),
    );
  });

  it("treats a sub-1 interval as 1", () => {
    const due = utc(2026, 0, 10);
    expect(advanceDueAt(due, { freq: "daily", interval: 0 }, 0)).toBe(
      utc(2026, 0, 11),
    );
  });
});

describe("preset helpers", () => {
  it("maps presets to recurrences", () => {
    expect(recurrenceForPreset("none")).toBeUndefined();
    expect(recurrenceForPreset("weekly")).toEqual<Recurrence>({
      freq: "weekly",
      interval: 1,
    });
  });

  it("round-trips a recurrence back to its preset", () => {
    expect(presetForRecurrence(undefined)).toBe("none");
    expect(presetForRecurrence({ freq: "monthly", interval: 1 })).toBe(
      "monthly",
    );
  });
});
