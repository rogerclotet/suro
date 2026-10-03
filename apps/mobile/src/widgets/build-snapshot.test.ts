import type { Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
  buildWidgetSnapshot,
  pickWidgetEvents,
  widgetEventBounds,
} from "./build-snapshot";

const DAY = 86_400_000;

describe("widgetEventBounds", () => {
  it("covers local and UTC boundaries for thirty calendar days", () => {
    const now = new Date("2026-07-05T15:30:00");
    const { from, to } = widgetEventBounds(now);
    expect(from).toBe(
      Math.min(new Date(2026, 6, 5).getTime(), Date.UTC(2026, 6, 5)),
    );
    expect(to).toBe(
      Math.max(
        new Date(2026, 7, 3, 23, 59, 59, 999).getTime(),
        Date.UTC(2026, 7, 4) - 1,
      ),
    );
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
      lists: {
        favoriteIds: ["l1" as Id<"lists">],
        previews: [
          {
            _id: "l1" as Id<"lists">,
            projectId: "p1" as Id<"projects">,
            description: undefined,
            eventId: undefined,
            name: "Groceries",
            done: 2,
            total: 5,
          },
        ],
      },
    });
    expect(snapshot.projectName).toBe("Flatmates");
    expect(snapshot.events[0]?.path).toBe("/p1/calendar/e1");
    expect(snapshot.lists[0]?.path).toBe("/p1/lists/l1");
    expect(snapshot.lists[0]).toMatchObject({
      name: "Groceries",
      done: 2,
      total: 5,
    });
    expect(snapshot).not.toHaveProperty("tasks");
  });
});

it("preserves starred-list order and completion counts, excluding other previews", () => {
  const previews = Array.from({ length: 5 }, (_, index) => ({
    _id: String(index) as Id<"lists">,
    projectId: "p1" as Id<"projects">,
    description: undefined,
    eventId: undefined,
    name: `List ${index}`,
    done: index,
    total: index,
  }));
  const snapshot = buildWidgetSnapshot({
    signedIn: true,
    locale: "es",
    projectId: "p1",
    lists: {
      previews,
      favoriteIds: ["3", "0", "2", "1"] as Id<"lists">[],
    },
  });
  expect(snapshot.lists.map((list) => list.id)).toEqual(["3", "0", "2"]);
  expect(snapshot.lists[0]).toMatchObject({ done: 3, total: 3 });
  expect(snapshot.lists[1]).toMatchObject({ done: 0, total: 0 });
  expect(snapshot.labels.featuredLists).toBeTruthy();
});
