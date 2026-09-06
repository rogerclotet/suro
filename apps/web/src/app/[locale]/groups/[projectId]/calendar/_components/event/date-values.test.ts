import { expect, it } from "vitest";
import {
  eventDatesForForm,
  eventDatesForMutation,
  selectEventDays,
} from "./date-values";

it("changes the day while preserving edited hours and minutes", () => {
  const result = selectEventDays(
    new Date(2026, 8, 7),
    new Date(2026, 8, 7),
    false,
    { from: new Date(2026, 8, 6, 14, 15), to: new Date(2026, 8, 6, 16, 45) },
  );
  expect(result.from).toEqual(new Date(2026, 8, 7, 14, 15));
  expect(result.to).toEqual(new Date(2026, 8, 7, 16, 45));
});

it("keeps a positive duration when collapsing a multiday overnight event to one day", () => {
  const result = selectEventDays(
    new Date(2026, 8, 7),
    new Date(2026, 8, 7),
    false,
    { from: new Date(2026, 8, 6, 23, 30), to: new Date(2026, 8, 7, 1, 0) },
  );
  expect(result.to).toEqual(new Date(2026, 8, 8, 0, 30));
});

it("round-trips all-day ranges through local picker days and an inclusive API end", () => {
  for (const [start, end] of [
    [Date.UTC(2026, 2, 28), Date.UTC(2026, 2, 31)],
    [Date.UTC(2026, 9, 25), Date.UTC(2026, 9, 26)],
  ]) {
    if (start === undefined || end === undefined)
      throw new Error("Fixture missing");
    const dates = eventDatesForForm({
      startAt: new Date(start),
      endAt: new Date(end),
      allDay: true,
    });
    expect(dates.from.getHours()).toBe(0);
    expect(eventDatesForMutation({ dates, allDay: true })).toEqual({
      startAt: start,
      endAt: end - 86_400_000,
      allDay: true,
    });
  }
});

it("preserves timed instants and does not turn incomplete input into year zero", () => {
  const from = new Date(2026, 8, 6, 12, 15);
  const to = new Date(2026, 8, 6, 13, 15);
  expect(eventDatesForMutation({ dates: { from, to }, allDay: false })).toEqual(
    { startAt: from.getTime(), endAt: to.getTime(), allDay: false },
  );
  expect(eventDatesForMutation({ dates: { from }, allDay: true })).toBeNull();
});
