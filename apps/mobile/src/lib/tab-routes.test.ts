import { describe, expect, it } from "vitest";
import { attachedRoute, eventRoute, hostTab, listRoute } from "./tab-routes";

describe("tab routes", () => {
  it("keeps an event and its attachments in the tab that opened it", () => {
    expect(hostTab("/group/home/event/event")).toBe("home");
    expect(hostTab("/group/calendar/event")).toBe("calendar");
    expect(eventRoute("group", "home", "event")).toBe(
      "/group/home/event/event",
    );
    expect(eventRoute("group", "calendar", "event")).toBe(
      "/group/calendar/event",
    );
    expect(attachedRoute("group", "home", "note", "note")).toBe(
      "/group/home/note/note",
    );
    expect(attachedRoute("group", "calendar", "expense", "pot")).toBe(
      "/group/calendar/expense/pot",
    );
  });

  it("opens My Tasks' lists in the tab that shows My Tasks", () => {
    expect(listRoute("group", "/group/home/tasks", "list")).toBe(
      "/group/home/list/list",
    );
    expect(listRoute("group", "/group/lists/tasks", "list")).toBe(
      "/group/lists/list",
    );
  });
});
