import { describe, expect, it } from "vitest";
import {
  calendarQueryBounds,
  changeEventDays,
  changeEventEnd,
  changeEventStart,
  createEventDateDraft,
  DAY_MS,
  editEventDateDraft,
  eventDatesForForm,
  eventDatesForMutation,
  eventOverlapsDays,
  eventOverlapsRange,
  HOUR_MS,
  inclusiveDayCount,
  isEventOnDay,
  normalizeEventEnd,
  pickUpcomingEvents,
  selectEventDays,
  timeRemainingParts,
  toggleEventAllDay,
} from "./events";

// Run this file in UTC, America/New_York, Europe/Madrid and Asia/Kathmandu.
describe("UTC date-only storage and local calendar days", () => {
  it.each([
    [2026, 8, 24],
    [2026, 2, 8],
    [2026, 2, 29],
    [2026, 9, 25],
    [2026, 10, 1],
  ])("round-trips %i-%i-%i without timezone shifts", (year, month, day) => {
    const event = {
      startAt: Date.UTC(year, month, day),
      endAt: Date.UTC(year, month, day + 3),
      allDay: true,
    };
    const dates = eventDatesForForm(event);
    expect(dates).toEqual({
      from: new Date(year, month, day),
      to: new Date(year, month, day + 2),
    });
    expect(inclusiveDayCount(dates.from, dates.to)).toBe(3);
    const args = eventDatesForMutation({ dates, allDay: true });
    expect({
      ...args,
      endAt: normalizeEventEnd(args.endAt, args.allDay),
    }).toEqual(event);
    expect(isEventOnDay(event, new Date(year, month, day - 1, 12))).toBe(false);
    expect(isEventOnDay(event, new Date(year, month, day, 12))).toBe(true);
    expect(isEventOnDay(event, new Date(year, month, day + 2, 23))).toBe(true);
    expect(isEventOnDay(event, new Date(year, month, day + 3))).toBe(false);
  });
  it("keeps timed instants unchanged", () => {
    const event = {
      startAt: new Date(2026, 8, 24, 22).getTime(),
      endAt: new Date(2026, 8, 25, 1).getTime(),
      allDay: false,
    };
    expect(
      eventDatesForMutation({ dates: eventDatesForForm(event), allDay: false }),
    ).toEqual(event);
  });
  it("excludes a timed event's midnight end from the next day", () => {
    const event = {
      startAt: new Date(2026, 8, 24, 23).getTime(),
      endAt: new Date(2026, 8, 25).getTime(),
      allDay: false,
    };
    expect(isEventOnDay(event, new Date(2026, 8, 24))).toBe(true);
    expect(isEventOnDay(event, new Date(2026, 8, 25))).toBe(false);
  });
  it.each([
    [2026, 2, 8],
    [2026, 2, 29],
    [2026, 9, 25],
    [2026, 10, 1],
  ])(
    "fetches all-day and timed events at both query boundaries across DST",
    (year, month, day) => {
      const from = new Date(year, month, day - 1);
      const to = new Date(year, month, day + 1);
      const bounds = calendarQueryBounds(from, to);
      for (const date of [day - 1, day + 1]) {
        for (const allDay of [true, false]) {
          const startAt = allDay
            ? Date.UTC(year, month, date)
            : new Date(year, month, date, 23, 30).getTime();
          const event = {
            startAt,
            endAt: startAt + (allDay ? DAY_MS : 30 * 60_000),
            allDay,
          };
          expect(eventOverlapsRange(event, bounds.from, bounds.to)).toBe(true);
          expect(eventOverlapsDays(event, from, to)).toBe(true);
        }
      }
      const previous = {
        startAt: Date.UTC(year, month, day - 2),
        endAt: Date.UTC(year, month, day - 1),
        allDay: true,
      };
      expect(eventOverlapsDays(previous, from, to)).toBe(false);
    },
  );
  it("keeps tomorrow's all-day events upcoming in zones behind UTC", () => {
    const event = {
      startAt: Date.UTC(2026, 8, 25),
      endAt: Date.UTC(2026, 8, 26),
      allDay: true,
    };
    expect(pickUpcomingEvents([event], new Date(2026, 8, 24, 23))).toEqual([
      event,
    ]);
    expect(
      timeRemainingParts(event, new Date(2026, 8, 24, 23).getTime()),
    ).toEqual({ kind: "oneHourMinutes", minutes: 0 });
  });
});

describe("event form dates", () => {
  const now = new Date(2026, 8, 24, 10, 12, 34);
  it("starts all-day and suggests the next half-hour for today", () => {
    const draft = createEventDateDraft(now);
    expect(draft.allDay).toBe(true);
    expect(draft.dates).toEqual({
      from: new Date(2026, 8, 24),
      to: new Date(2026, 8, 24),
    });
    expect(toggleEventAllDay(draft, false, now).dates).toEqual({
      from: new Date(2026, 8, 24, 10, 30),
      to: new Date(2026, 8, 24, 11, 30),
    });
  });
  it("uses 09:00 for another day, including edits of existing all-day events", () => {
    const event = {
      startAt: Date.UTC(2026, 8, 25),
      endAt: Date.UTC(2026, 8, 26),
      allDay: true,
    };
    expect(
      toggleEventAllDay(editEventDateDraft(event), false, now).dates,
    ).toEqual({
      from: new Date(2026, 8, 25, 9),
      to: new Date(2026, 8, 25, 10),
    });
  });
  it("lets a late-night suggestion cross midnight instead of suggesting a past time", () => {
    const late = new Date(2026, 8, 24, 23, 45);
    expect(
      toggleEventAllDay(createEventDateDraft(late), false, late).dates,
    ).toEqual({ from: new Date(2026, 8, 25), to: new Date(2026, 8, 25, 1) });
  });
  it("preserves a custom duration when start moves, including overnight", () => {
    const dates = {
      from: new Date(2026, 8, 24, 14, 15),
      to: new Date(2026, 8, 24, 16, 45),
    };
    expect(changeEventStart(dates, new Date(2026, 8, 24, 23, 30))).toEqual({
      from: new Date(2026, 8, 24, 23, 30),
      to: new Date(2026, 8, 25, 2),
    });
  });
  it("keeps edited times across all-day toggles and date changes", () => {
    const dates = {
      from: new Date(2026, 8, 24, 14, 15),
      to: new Date(2026, 8, 24, 16, 45),
    };
    const allDay = toggleEventAllDay({ allDay: false, dates }, true, now);
    expect(toggleEventAllDay(allDay, false, now).dates).toEqual(dates);
    const moved = changeEventDays(allDay, {
      from: new Date(2026, 8, 26),
      to: new Date(2026, 8, 26),
    });
    expect(toggleEventAllDay(moved, false, now).dates).toEqual({
      from: new Date(2026, 8, 26, 14, 15),
      to: new Date(2026, 8, 26, 16, 45),
    });
    expect(
      changeEventDays({ allDay: false, dates }, moved.dates).dates,
    ).toEqual(toggleEventAllDay(moved, false, now).dates);
  });
  it("keeps an explicitly chosen end and moves start back when necessary", () => {
    const dates = {
      from: new Date(2026, 8, 24, 9),
      to: new Date(2026, 8, 24, 10),
    };
    expect(changeEventEnd(dates, new Date(2026, 8, 24))).toEqual({
      from: new Date(2026, 8, 23, 23),
      to: new Date(2026, 8, 24),
    });
  });
  it.each([
    [2026, 2, 8],
    [2026, 2, 29],
    [2026, 9, 25],
    [2026, 10, 1],
  ])(
    "uses elapsed duration across daylight-saving transitions",
    (year, month, day) => {
      const from = new Date(year, month, day, 1, 45);
      const dates = { from, to: new Date(from.getTime() + HOUR_MS) };
      const changed = changeEventStart(
        dates,
        new Date(year, month, day, 3, 30),
      );
      expect(changed.to.getTime() - changed.from.getTime()).toBe(HOUR_MS);
      const suggested = selectEventDays(from, from, false, undefined, from);
      expect(suggested.from.getTime()).toBeGreaterThan(from.getTime());
      expect(suggested.to.getTime() - suggested.from.getTime()).toBe(HOUR_MS);
    },
  );
});
