import { beforeEach, expect, it, vi } from "vitest";
import { buildWidgetSnapshot } from "./build-snapshot";
import { readWidgetSnapshot, writeWidgetSnapshot } from "./storage";

const disk = vi.hoisted(() => new Map<string, string>());
vi.mock("@/lib/offline/storage", () => ({
  readRaw: (key: string) => disk.get(key),
  writeRaw: (key: string, value: string) => disk.set(key, value),
}));

beforeEach(() => disk.clear());

it("reads current snapshots with starred lists", () => {
  const snapshot = buildWidgetSnapshot({
    signedIn: true,
    locale: "en",
    projectId: "p1",
  });
  snapshot.lists = [
    { id: "l1", name: "Groceries", done: 2, total: 5, path: "/p1/lists/l1" },
  ];
  writeWidgetSnapshot("p1", snapshot);
  expect(readWidgetSnapshot("p1")).toEqual(snapshot);
});

it("preserves events from old task snapshots and supplies the new localized list labels", () => {
  const { lists: _lists, ...old } = buildWidgetSnapshot({
    signedIn: true,
    locale: "es",
    projectId: "p1",
  });
  old.events = [
    { id: "e1", name: "Dinner", when: "19:00", path: "/p1/calendar/e1" },
  ];
  disk.set(
    "suro.widgetSnapshot:p1",
    JSON.stringify({
      ...old,
      labels: { myTasks: "Old tasks" },
      tasks: [{ name: "Old task" }],
    }),
  );
  const migrated = readWidgetSnapshot("p1");
  expect(migrated?.events).toEqual(old.events);
  expect(migrated?.lists).toEqual([]);
  expect(migrated?.labels.featuredLists).toBeTruthy();
  expect(migrated?.labels).not.toHaveProperty("myTasks");
  expect(migrated).not.toHaveProperty("tasks");
});

it.each(["broken JSON", "null", '{"events": []}', '{"lists": "invalid"}'])(
  "ignores malformed caches: %s",
  (raw) => {
    disk.set("suro.widgetSnapshot:p1", raw);
    expect(readWidgetSnapshot("p1")).toBeNull();
  },
);
