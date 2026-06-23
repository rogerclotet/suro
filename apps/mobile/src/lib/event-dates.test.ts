import { describe, expect, it } from "vitest";
import {
  allDayDisplayEnd,
  DAY_MS,
  type EventTimes,
  endOfDay,
  formatTimeRange,
  inclusiveDayCount,
  isEventOnDay,
  sameDay,
  startOfDay,
  timeRemainingParts,
  utcMidnight,
} from "./event-dates";

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

// Build a timed event from local Date parts so the local-time logic under test
// is deterministic regardless of the test runner's timezone.
function timed(
  start: [number, number, number, number?, number?],
  end: [number, number, number, number?, number?],
): EventTimes {
  return {
    startAt: new Date(...start).getTime(),
    endAt: new Date(...end).getTime(),
    allDay: false,
  };
}

// All-day events are stored half-open: endAt is local midnight of the day
// *after* the last covered day.
function allDay(
  firstDay: [number, number, number],
  dayAfterLast: [number, number, number],
): EventTimes {
  return {
    startAt: new Date(...firstDay).getTime(),
    endAt: new Date(...dayAfterLast).getTime(),
    allDay: true,
  };
}

describe("DAY_MS", () => {
  it("is one day in milliseconds", () => {
    expect(DAY_MS).toBe(86_400_000);
  });
});

describe("sameDay", () => {
  it("is true for the same calendar day at different times", () => {
    expect(
      sameDay(new Date(2024, 0, 15, 1, 0), new Date(2024, 0, 15, 23, 0)),
    ).toBe(true);
  });

  it("is false across midnight", () => {
    expect(
      sameDay(new Date(2024, 0, 15, 23, 59), new Date(2024, 0, 16, 0, 0)),
    ).toBe(false);
  });

  it("distinguishes same day-of-month in different months/years", () => {
    expect(sameDay(new Date(2024, 0, 15), new Date(2024, 1, 15))).toBe(false);
    expect(sameDay(new Date(2024, 0, 15), new Date(2025, 0, 15))).toBe(false);
  });
});

describe("startOfDay", () => {
  it("returns midnight of the given day", () => {
    const result = startOfDay(new Date(2024, 5, 20, 14, 37, 12, 500));
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("does not mutate the input", () => {
    const input = new Date(2024, 5, 20, 14, 0);
    startOfDay(input);
    expect(input.getHours()).toBe(14);
  });
});

describe("endOfDay", () => {
  it("returns the last instant of the given day", () => {
    const result = endOfDay(new Date(2024, 5, 20, 14, 37, 12, 500));
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("does not mutate the input", () => {
    const input = new Date(2024, 5, 20, 14, 0);
    endOfDay(input);
    expect(input.getHours()).toBe(14);
  });
});

describe("utcMidnight", () => {
  it("returns the UTC-midnight epoch for a calendar day", () => {
    expect(utcMidnight(2024, 0, 15)).toBe(Date.UTC(2024, 0, 15, 0, 0, 0, 0));
  });
});

describe("allDayDisplayEnd", () => {
  it("subtracts a day from the half-open end boundary", () => {
    // Stored endAt = Jan 16 (day after) → last displayed day is Jan 15.
    const result = allDayDisplayEnd(new Date(2024, 0, 16).getTime());
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });
});

describe("inclusiveDayCount", () => {
  it("counts a single day as one", () => {
    expect(
      inclusiveDayCount(new Date(2024, 0, 15), new Date(2024, 0, 15)),
    ).toBe(1);
  });

  it("counts an inclusive multi-day span", () => {
    // Jan 15–18 inclusive = 4 days.
    expect(
      inclusiveDayCount(new Date(2024, 0, 15), new Date(2024, 0, 18)),
    ).toBe(4);
  });

  it("ignores time-of-day", () => {
    expect(
      inclusiveDayCount(
        new Date(2024, 0, 15, 23, 59),
        new Date(2024, 0, 16, 0, 1),
      ),
    ).toBe(2);
  });

  it("is order-independent", () => {
    expect(
      inclusiveDayCount(new Date(2024, 0, 18), new Date(2024, 0, 15)),
    ).toBe(4);
  });

  it("spans a DST transition exactly", () => {
    // US spring-forward 2024 was Mar 10; the count stays whole-day exact.
    expect(inclusiveDayCount(new Date(2024, 2, 9), new Date(2024, 2, 11))).toBe(
      3,
    );
  });
});

describe("isEventOnDay", () => {
  it("matches a timed event only on its own day", () => {
    const event = timed([2024, 0, 15, 9, 0], [2024, 0, 15, 10, 0]);
    expect(isEventOnDay(event, new Date(2024, 0, 14))).toBe(false);
    expect(isEventOnDay(event, new Date(2024, 0, 15))).toBe(true);
    expect(isEventOnDay(event, new Date(2024, 0, 16))).toBe(false);
  });

  it("treats the half-open all-day end as exclusive", () => {
    // Single all-day event covering only Jan 15 (stored endAt = Jan 16).
    const event = allDay([2024, 0, 15], [2024, 0, 16]);
    expect(isEventOnDay(event, new Date(2024, 0, 14))).toBe(false);
    expect(isEventOnDay(event, new Date(2024, 0, 15))).toBe(true);
    expect(isEventOnDay(event, new Date(2024, 0, 16))).toBe(false);
  });

  it("covers every day of a multi-day all-day span", () => {
    // Jan 15–17 inclusive (stored endAt = Jan 18).
    const event = allDay([2024, 0, 15], [2024, 0, 18]);
    expect(isEventOnDay(event, new Date(2024, 0, 15))).toBe(true);
    expect(isEventOnDay(event, new Date(2024, 0, 16))).toBe(true);
    expect(isEventOnDay(event, new Date(2024, 0, 17))).toBe(true);
    expect(isEventOnDay(event, new Date(2024, 0, 18))).toBe(false);
  });
});

describe("formatTimeRange", () => {
  const DATE_OPTS = {
    year: "numeric",
    month: "short",
    day: "numeric",
  } as const;
  const TIME_OPTS = { hour: "numeric", minute: "2-digit" } as const;

  it("shows a single date for a one-day all-day event", () => {
    const event = allDay([2024, 0, 15], [2024, 0, 16]);
    const expected = new Date(2024, 0, 15).toLocaleDateString(
      "en-US",
      DATE_OPTS,
    );
    expect(formatTimeRange(event, "en-US")).toBe(expected);
    expect(formatTimeRange(event, "en-US")).not.toContain(" - ");
  });

  it("shows a date range for a multi-day all-day event", () => {
    const event = allDay([2024, 0, 15], [2024, 0, 18]);
    const result = formatTimeRange(event, "en-US");
    expect(result).toContain(" - ");
    expect(result).toContain(
      new Date(2024, 0, 15).toLocaleDateString("en-US", DATE_OPTS),
    );
    expect(result).toContain(
      new Date(2024, 0, 17).toLocaleDateString("en-US", DATE_OPTS),
    );
  });

  it("shows a time range for a same-day timed event", () => {
    const event = timed([2024, 0, 15, 9, 0], [2024, 0, 15, 11, 30]);
    const expected = `${new Date(2024, 0, 15, 9, 0).toLocaleString("en-US", {
      ...DATE_OPTS,
      ...TIME_OPTS,
    })} - ${new Date(2024, 0, 15, 11, 30).toLocaleTimeString("en-US", TIME_OPTS)}`;
    expect(formatTimeRange(event, "en-US")).toBe(expected);
  });

  it("shows full datetimes for a cross-day timed event", () => {
    const event = timed([2024, 0, 15, 22, 0], [2024, 0, 16, 1, 0]);
    const expected = `${new Date(2024, 0, 15, 22, 0).toLocaleString("en-US", {
      ...DATE_OPTS,
      ...TIME_OPTS,
    })} - ${new Date(2024, 0, 16, 1, 0).toLocaleString("en-US", {
      ...DATE_OPTS,
      ...TIME_OPTS,
    })}`;
    expect(formatTimeRange(event, "en-US")).toBe(expected);
  });
});

describe("timeRemainingParts", () => {
  const now = 1_700_000_000_000;
  const at = (offsetMs: number): EventTimes => ({
    startAt: now + offsetMs,
    endAt: now + offsetMs + HOUR_MS,
    allDay: false,
  });

  it("returns null once the event has started", () => {
    expect(timeRemainingParts(at(-1), now)).toBeNull();
  });

  it("returns null at the exact start moment", () => {
    expect(timeRemainingParts(at(0), now)).toBeNull();
  });

  it("collapses to whole days when more than two days out", () => {
    expect(timeRemainingParts(at(3 * DAY_MS + 5 * HOUR_MS), now)).toEqual({
      kind: "days",
      days: 3,
    });
  });

  it("collapses to whole days when on a day boundary", () => {
    expect(timeRemainingParts(at(2 * DAY_MS), now)).toEqual({
      kind: "days",
      days: 2,
    });
  });

  it("includes hours for the 1–2 day window", () => {
    expect(timeRemainingParts(at(1 * DAY_MS + 3 * HOUR_MS), now)).toEqual({
      kind: "daysHours",
      days: 1,
      hours: 3,
    });
  });

  it("shows whole hours when more than an hour but under a day", () => {
    expect(timeRemainingParts(at(5 * HOUR_MS + 30 * MINUTE_MS), now)).toEqual({
      kind: "hours",
      hours: 5,
    });
  });

  it("shows minutes-within-the-hour for the final hour", () => {
    // Regression guard: the PWA reported total minutes (60+) here; the mobile
    // port reports minutes *within* the hour so "1 hour and N minutes" reads
    // correctly.
    expect(timeRemainingParts(at(1 * HOUR_MS + 20 * MINUTE_MS), now)).toEqual({
      kind: "oneHourMinutes",
      minutes: 20,
    });
  });

  it("shows bare minutes under an hour", () => {
    expect(timeRemainingParts(at(45 * MINUTE_MS), now)).toEqual({
      kind: "minutes",
      minutes: 45,
    });
  });
});
