import { describe, expect, it } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import { buildIcs, escapeText } from "./ics";

// Minimal event factory — only the fields buildIcs reads matter; the rest are
// cast to satisfy Doc<"events"> in tests.
function event(over: Partial<Doc<"events">>): Doc<"events"> {
  return {
    _id: "evt1" as Id<"events">,
    _creationTime: 0,
    name: "Event",
    startAt: 0,
    endAt: 0,
    allDay: false,
    projectId: "prj1" as Id<"projects">,
    createdBy: "usr1" as Id<"users">,
    updatedAt: 0,
    ...over,
  };
}

const baseArgs = {
  calendarName: "Family",
  eventUrl: (id: Id<"events">) => `https://example.test/e/${id}`,
  organizerById: new Map(),
  attendees: [],
  now: Date.UTC(2024, 0, 1, 0, 0, 0),
};

describe("escapeText", () => {
  it("escapes backslash, semicolon, comma and newlines (RFC 5545)", () => {
    expect(escapeText("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });
});

describe("buildIcs", () => {
  it("formats a timed event as UTC date-times", () => {
    const ics = buildIcs({
      ...baseArgs,
      events: [
        event({
          _id: "evtA" as Id<"events">,
          name: "Dinner",
          startAt: Date.UTC(2024, 0, 10, 9, 0, 0),
          endAt: Date.UTC(2024, 0, 10, 10, 30, 0),
          allDay: false,
        }),
      ],
    });
    expect(ics).toContain("DTSTART:20240110T090000Z");
    expect(ics).toContain("DTEND:20240110T103000Z");
    expect(ics).toContain("DTSTAMP:20240101T000000Z");
    expect(ics).toContain("SUMMARY:Dinner");
    expect(ics).toContain("URL:https://example.test/e/evtA");
  });

  it("formats an all-day event as VALUE=DATE, using the stored exclusive end", () => {
    const ics = buildIcs({
      ...baseArgs,
      events: [
        event({
          name: "Holiday",
          startAt: Date.UTC(2024, 0, 10),
          // Stored endAt = last day (Jan 12) + 1 day = Jan 13, which is exactly
          // ICS's exclusive all-day DTEND — used verbatim.
          endAt: Date.UTC(2024, 0, 13),
          allDay: true,
        }),
      ],
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20240110");
    expect(ics).toContain("DTEND;VALUE=DATE:20240113");
  });

  it("wraps events in a VCALENDAR with the calendar name and CRLF lines", () => {
    const ics = buildIcs({ ...baseArgs, events: [] });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("X-WR-CALNAME:Family");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("emits organizer and attendee contact lines", () => {
    const ics = buildIcs({
      ...baseArgs,
      events: [event({ _id: "evtZ" as Id<"events"> })],
      organizerById: new Map([
        ["evtZ" as Id<"events">, { name: "Alice", email: "alice@test" }],
      ]),
      attendees: [{ name: "Bob", email: "bob@test" }],
    });
    expect(ics).toContain("ORGANIZER;CN=Alice:mailto:alice@test");
    expect(ics).toContain("ATTENDEE;CN=Bob:mailto:bob@test");
  });
});
