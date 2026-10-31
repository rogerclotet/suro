import { describe, expect, it } from "vitest";
import { advanceDueAt, dueBucket } from "./tasks";

const DAY_MS = 86_400_000;
const at = (iso: string) => Date.parse(iso);

describe("advanceDueAt", () => {
  it("advances daily to the next day after an on-time completion", () => {
    const due = at("2024-01-10T09:00:00Z");
    const now = at("2024-01-10T10:00:00Z"); // 1h after due
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, now)).toBe(
      at("2024-01-11T09:00:00Z"),
    );
  });

  it("rolls forward past several missed daily occurrences", () => {
    const due = at("2024-01-01T09:00:00Z");
    const now = at("2024-01-05T10:00:00Z");
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, now)).toBe(
      at("2024-01-06T09:00:00Z"),
    );
  });

  it("honors an interval greater than 1", () => {
    const due = at("2024-01-10T09:00:00Z");
    const now = due + 1000;
    expect(advanceDueAt(due, { freq: "daily", interval: 3 }, now)).toBe(
      at("2024-01-13T09:00:00Z"),
    );
  });

  it("advances weekly by 7 days, keeping the weekday and time", () => {
    const due = at("2024-01-01T08:00:00Z"); // Monday
    expect(advanceDueAt(due, { freq: "weekly", interval: 1 }, due + 1000)).toBe(
      at("2024-01-08T08:00:00Z"),
    );
  });

  it("clamps a month-end day to the shorter target month", () => {
    const due = at("2024-01-31T09:00:00Z");
    expect(
      advanceDueAt(due, { freq: "monthly", interval: 1 }, due + 1000),
    ).toBe(
      at("2024-02-29T09:00:00Z"), // 2024 is a leap year
    );
  });

  it("clamps a leap day to Feb 28 the next year", () => {
    const due = at("2024-02-29T09:00:00Z");
    expect(advanceDueAt(due, { freq: "yearly", interval: 1 }, due + 1000)).toBe(
      at("2025-02-28T09:00:00Z"),
    );
  });

  it("keeps an all-day (UTC midnight) due at midnight", () => {
    const due = Date.UTC(2024, 0, 10);
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, due + 1000)).toBe(
      Date.UTC(2024, 0, 11),
    );
    expect(advanceDueAt(due, { freq: "daily", interval: 1 }, due + 1000)).toBe(
      due + DAY_MS,
    );
  });

  it("treats a fractional or zero interval as at least 1", () => {
    const due = at("2024-01-10T09:00:00Z");
    expect(advanceDueAt(due, { freq: "daily", interval: 0 }, due + 1000)).toBe(
      at("2024-01-11T09:00:00Z"),
    );
  });
});

describe("dueBucket", () => {
  // Local noon, so the local day is the same in every test timezone.
  const now = new Date(2024, 0, 10, 12, 0);

  it("files undated tasks under no date", () => {
    expect(dueBucket({}, now)).toBe("noDate");
    expect(dueBucket({ dueAt: null }, now)).toBe("noDate");
  });

  it("compares timed dues by their local day", () => {
    expect(
      dueBucket({ dueAt: new Date(2024, 0, 9, 23, 59).getTime() }, now),
    ).toBe("overdue");
    expect(dueBucket({ dueAt: new Date(2024, 0, 10, 8).getTime() }, now)).toBe(
      "today",
    );
    expect(dueBucket({ dueAt: new Date(2024, 0, 11).getTime() }, now)).toBe(
      "upcoming",
    );
  });

  it("reads all-day dues from their UTC date", () => {
    const allDay = (iso: string) => ({ dueAt: at(iso), dueAllDay: true });
    expect(dueBucket(allDay("2024-01-09T00:00:00Z"), now)).toBe("overdue");
    expect(dueBucket(allDay("2024-01-10T00:00:00Z"), now)).toBe("today");
    expect(dueBucket(allDay("2024-01-11T00:00:00Z"), now)).toBe("upcoming");
  });
});
