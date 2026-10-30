import type { Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
  notificationVisit,
  type UnreadSection,
  unreadCount,
  unreadElsewhere,
  unreadInSection,
} from "./notifications";

const GROUP = "/groups/[projectId]";

describe("notification visits", () => {
  it("maps item screens to their item", () => {
    const cases: [string, Record<string, string>, string][] = [
      [`${GROUP}/lists/[listId]`, { listId: "list" }, "list"],
      [
        `${GROUP}/lists/templates/[templateId]`,
        { templateId: "template" },
        "template",
      ],
      [`${GROUP}/calendar/[eventId]`, { eventId: "event" }, "event"],
      [`${GROUP}/expenses/[potId]`, { potId: "pot" }, "pot"],
      [`${GROUP}/notes/[noteId]/edit`, { noteId: "note" }, "note"],
    ];
    for (const [pathname, params, id] of cases) {
      expect(
        notificationVisit(pathname, { projectId: "group", ...params }),
      ).toEqual({ projectId: "group", scope: "item", id });
    }
  });

  it("treats indexes as indexes and whole-section pages as pages", () => {
    expect(notificationVisit(`${GROUP}/lists`, { projectId: "group" })).toEqual(
      { projectId: "group", scope: "index", section: "lists" },
    );
    expect(
      notificationVisit(`${GROUP}/secret-santa/ideas`, { projectId: "group" }),
    ).toEqual({ projectId: "group", scope: "page", section: "secretSanta" });
    expect(
      notificationVisit(`${GROUP}/settings`, { projectId: "group" }),
    ).toEqual({ projectId: "group", scope: "page", section: "members" });
  });

  it("reads nothing on Home, My tasks, the switcher or account pages", () => {
    for (const pathname of [
      `${GROUP}/home`,
      `${GROUP}/lists/tasks`,
      `${GROUP}/lists/templates`,
      `${GROUP}/groups`,
    ]) {
      expect(notificationVisit(pathname, { projectId: "group" })).toBeNull();
    }
    expect(notificationVisit("/profile", {})).toBeNull();
  });
});

describe("unread counts", () => {
  const receipt = (
    projectId: string,
    section: UnreadSection["section"],
    count: number,
  ) =>
    ({
      projectId: projectId as Id<"projects">,
      section,
      count,
      ids: [],
      latestId: "latest" as Id<"notifications">,
      destination: { kind: "path", path: "/" },
      targets: [],
    }) satisfies UnreadSection;
  const rows = [
    receipt("group", "notes", 2),
    receipt("group", "members", 1),
    receipt("group", "lists", 5),
    receipt("other", "lists", 3),
  ];

  it("aggregates Home from the sections its chips link to", () => {
    expect(unreadCount(rows, "group", "home")).toBe(2);
    expect(unreadCount(rows, "group", "lists")).toBe(5);
    expect(unreadCount(rows, "group")).toBe(8);
  });

  it("counts other groups and members for the group switcher", () => {
    expect(unreadElsewhere(rows, "group")).toBe(3);
    expect(unreadElsewhere(rows, undefined)).toBe(11);
    expect(unreadInSection(rows, "members")).toBe(1);
    expect(unreadInSection(rows, "lists")).toBe(8);
  });
});
