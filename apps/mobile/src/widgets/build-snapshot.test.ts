import { describe, expect, it } from "vitest";
import {
  buildWidgetSnapshot,
  pickWidgetEvents,
  pickWidgetTasks,
  widgetEventBounds,
} from "./build-snapshot";

const DAY = 86_400_000;

describe("widgetEventBounds", () => {
  it("queries from the start of today", () => {
    const now = new Date("2026-07-05T15:30:00");
    const { from, to } = widgetEventBounds(now);
    expect(new Date(from).getHours()).toBe(0);
    expect(to - from).toBe(30 * DAY);
  });
});

describe("pickWidgetEvents", () => {
  const today = new Date("2026-07-05T12:00:00");

  it("prefers today's events before upcoming ones", () => {
    const events = pickWidgetEvents(
      [
        {
          _id: "a",
          name: "Tomorrow",
          startAt: today.getTime() + DAY,
          endAt: today.getTime() + DAY + 3_600_000,
          allDay: false,
        },
        {
          _id: "b",
          name: "Today",
          startAt: today.getTime() + 3_600_000,
          endAt: today.getTime() + 7_200_000,
          allDay: false,
        },
      ],
      today,
    );
    expect(events.map((event) => event._id)).toEqual(["b", "a"]);
  });

  it("caps at the preview limit", () => {
    const events = pickWidgetEvents(
      Array.from({ length: 5 }, (_, index) => ({
        _id: String(index),
        name: `Event ${index}`,
        startAt: today.getTime() + index * 3_600_000,
        endAt: today.getTime() + (index + 1) * 3_600_000,
        allDay: false,
      })),
      today,
    );
    expect(events).toHaveLength(3);
  });
});

describe("pickWidgetTasks", () => {
  it("keeps the server order and preview limit", () => {
    const tasks = pickWidgetTasks([
      { _id: "1", name: "A", listName: "Inbox", listId: "l1" } as never,
      { _id: "2", name: "B", listName: "Inbox", listId: "l1" } as never,
      { _id: "3", name: "C", listName: "Inbox", listId: "l1" } as never,
      { _id: "4", name: "D", listName: "Inbox", listId: "l1" } as never,
    ]);
    expect(tasks.map((task) => task._id)).toEqual(["1", "2", "3"]);
  });
});

describe("buildWidgetSnapshot", () => {
  it("builds a signed-out placeholder", () => {
    const snapshot = buildWidgetSnapshot({ signedIn: false, locale: "en" });
    expect(snapshot.signedIn).toBe(false);
    expect(snapshot.events).toEqual([]);
    expect(snapshot.labels.signIn).toBeTruthy();
  });

  it("maps project data into widget rows", () => {
    const now = new Date("2026-07-05T12:00:00");
    const snapshot = buildWidgetSnapshot({
      signedIn: true,
      locale: "en",
      projectId: "p1",
      projectName: "Flatmates",
      now,
      events: [
        {
          _id: "e1",
          name: "Dinner",
          startAt: now.getTime() + 3_600_000,
          endAt: now.getTime() + 7_200_000,
          allDay: false,
        },
      ],
      tasks: [
        {
          _id: "t1",
          name: "Buy milk",
          listName: "Groceries",
          listId: "l1",
          dueAt: now.getTime() + DAY,
          dueAllDay: true,
        } as never,
      ],
    });
    expect(snapshot.projectName).toBe("Flatmates");
    expect(snapshot.events[0]?.path).toBe("/p1/calendar/e1");
    expect(snapshot.tasks[0]?.path).toBe("/p1/lists/l1");
    expect(snapshot.tasks[0]?.dueLabel).toBeTruthy();
  });
});
