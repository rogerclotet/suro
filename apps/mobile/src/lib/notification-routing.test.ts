import type { Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
  notificationVisit,
  type UnreadSection,
  unreadCount,
  unreadElsewhere,
  unreadItems,
} from "./notification-routing";

// Convex ids are opaque at this pure routing boundary.
const projectId = "group" as Id<"projects">;
const latestId = "notification" as Id<"notifications">;
function receipt(section: UnreadSection["section"], count = 1): UnreadSection {
  return {
    projectId,
    section,
    latestId,
    ids: [latestId],
    count,
    destination: { kind: "path", path: `/${projectId}/${section}` },
    targets: [],
  };
}

describe("notification visits", () => {
  it("reads nothing on launch, Home, account pages, My tasks or the template index", () => {
    for (const path of [
      "/",
      "/groups",
      "/group/home",
      "/group/home/tasks",
      "/profile",
      "/preferences",
      "/create-group",
      "/group/lists/tasks",
      "/group/lists/templates",
      "/group/expenses/solo-expenses",
    ]) {
      expect(notificationVisit(path)).toBeNull();
    }
  });

  it("treats section indexes as indexes, not as reads of their items", () => {
    expect(notificationVisit("/group/lists")).toEqual({
      projectId: "group",
      scope: "index",
      section: "lists",
    });
    expect(notificationVisit("/group/calendar")?.scope).toBe("index");
    expect(notificationVisit("/group/expenses")?.scope).toBe("index");
    expect(notificationVisit("/group/home/notes")).toEqual({
      projectId: "group",
      scope: "index",
      section: "notes",
    });
  });

  it("maps every item screen to its item, in whichever tab hosts it", () => {
    const cases: [string, string][] = [
      ["/group/lists/list", "list"],
      ["/group/lists/templates/template", "template"],
      ["/group/calendar/event", "event"],
      ["/group/calendar/list/list", "list"],
      ["/group/calendar/note/note/edit", "note"],
      ["/group/calendar/expense/pot", "pot"],
      ["/group/expenses/pot", "pot"],
      ["/group/home/notes/note", "note"],
      ["/group/home/notes/note/edit", "note"],
      ["/group/home/event/event", "event"],
      ["/group/home/list/list", "list"],
      ["/group/home/note/note", "note"],
      ["/group/home/expense/pot", "pot"],
    ];
    for (const [path, id] of cases) {
      expect(notificationVisit(path)).toEqual({
        projectId: "group",
        scope: "item",
        id,
      });
    }
  });

  it("reads files, Secret Santa and members as whole pages", () => {
    expect(notificationVisit("/group/home/files")).toEqual({
      projectId: "group",
      scope: "page",
      section: "files",
    });
    expect(notificationVisit("/group/home/secret-santa/ideas")).toEqual({
      projectId: "group",
      scope: "page",
      section: "secretSanta",
    });
    expect(notificationVisit("/group-settings", "group")).toEqual({
      projectId: "group",
      scope: "page",
      section: "members",
    });
    expect(notificationVisit("/group-settings")).toBeNull();
  });
});

describe("unread aggregation", () => {
  it("aggregates Home badges without including Calendar, Lists or Expenses", () => {
    const rows = [
      receipt("notes", 2),
      receipt("files", 3),
      receipt("members"),
      receipt("secretSanta", 7),
      receipt("calendar", 4),
      receipt("lists", 5),
      receipt("expenses", 6),
    ];
    expect(unreadCount(rows, projectId, "home")).toBe(13);
    expect(unreadCount(rows, projectId)).toBe(28);
    expect(unreadCount(rows, projectId, "calendar")).toBe(4);
    expect(unreadCount(rows, "other-group")).toBe(0);
  });

  it("counts other groups' receipts for the group chip", () => {
    const other = {
      ...receipt("lists", 4),
      projectId: "other" as Id<"projects">,
    };
    expect(unreadElsewhere([receipt("notes", 2), other], projectId)).toBe(4);
    expect(unreadElsewhere([receipt("notes", 2)], projectId)).toBe(0);
  });

  it("lists one section's items within one group", () => {
    const lists = receipt("lists", 2);
    const item = (kind: "lists" | "templates", id: string) => ({
      kind,
      id: id as Id<"lists">,
      ids: [latestId],
      count: 1,
      gone: false,
      event: undefined,
    });
    lists.targets = [item("lists", "a"), item("templates", "b")];
    const elsewhere = { ...lists, projectId: "other" as Id<"projects"> };
    expect(
      unreadItems([lists, elsewhere, receipt("notes")], projectId, "lists").map(
        (item) => item.id,
      ),
    ).toEqual(["a", "b"]);
  });
});
