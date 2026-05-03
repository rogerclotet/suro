import { describe, expect, it } from "vitest";
import { getMonthEnd } from "./month-range";
import { normalizeEvents } from "./query";

describe("getMonthEnd", () => {
  it("returns the last millisecond of the month", () => {
    const monthStart = new Date(2024, 1, 1);
    const monthEnd = getMonthEnd(monthStart);

    expect(monthEnd.getFullYear()).toBe(2024);
    expect(monthEnd.getMonth()).toBe(1);
    expect(monthEnd.getDate()).toBe(29);
    expect(monthEnd.getHours()).toBe(23);
    expect(monthEnd.getMinutes()).toBe(59);
    expect(monthEnd.getSeconds()).toBe(59);
    expect(monthEnd.getMilliseconds()).toBe(999);
  });
});

describe("normalizeEvents", () => {
  it("converts serialized dates before sorting", () => {
    const events = normalizeEvents([
      {
        id: "late",
        name: "Late",
        description: null,
        startAt: "2026-03-20T10:00:00.000Z",
        endAt: "2026-03-20T11:00:00.000Z",
        allDay: false,
        createdAt: null,
        createdBy: "user-1",
        updatedAt: null,
        updatedBy: null,
        projectId: "project-1",
        files: [],
        project: {
          id: "project-1",
          name: "Project",
          createdBy: "user-1",
          inviteToken: "123e4567-e89b-12d3-a456-426614174000",
          image: null,
          color: "blue",
          users: [],
        },
      },
      {
        id: "early",
        name: "Early",
        description: null,
        startAt: "2026-03-10T10:00:00.000Z",
        endAt: "2026-03-10T11:00:00.000Z",
        allDay: false,
        createdAt: null,
        createdBy: "user-1",
        updatedAt: null,
        updatedBy: null,
        projectId: "project-1",
        files: [],
        project: {
          id: "project-1",
          name: "Project",
          createdBy: "user-1",
          inviteToken: "123e4567-e89b-12d3-a456-426614174000",
          image: null,
          color: "blue",
          users: [],
        },
      },
    ]);

    expect(events.map((event) => event.id)).toEqual(["early", "late"]);
    expect(events[0]?.startAt).toBeInstanceOf(Date);
    expect(events[1]?.endAt).toBeInstanceOf(Date);
  });
});
