import type { Id } from "backend/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
  notificationHref,
  notificationVisit,
  type UnreadSection,
  unreadCount,
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
  };
}

describe("notification navigation", () => {
  it("opens an event's month and carries the receipt identity even for repeated dates", () => {
    const calendar = receipt("calendar");
    calendar.destination = { kind: "calendar", startAt: Date.UTC(2027, 2, 12) };
    expect(notificationHref(calendar)).toBe(
      `/group/calendar?date=${Date.UTC(2027, 2, 12)}&notification=notification`,
    );
  });
  it("uses the same Home nesting as push links for notes and files", () => {
    const note = receipt("notes");
    note.destination = { kind: "path", path: "/group/notes/note" };
    expect(notificationHref(note)).toBe(
      "/group/home/notes/note?notification=notification",
    );
    expect(notificationHref(receipt("files"))).toBe(
      "/group/home/files?notification=notification",
    );
  });
  it("preserves group settings parameters and list or pot targets", () => {
    const members = receipt("members");
    members.destination = {
      kind: "path",
      path: "/group-settings?projectId=group",
    };
    expect(notificationHref(members)).toBe(
      "/group-settings?projectId=group&notification=notification",
    );
    for (const path of [
      "/group/lists/list",
      "/group/lists/templates/template",
      "/group/expenses/pot",
    ]) {
      const row = receipt("lists");
      row.destination = { kind: "path", path };
      expect(notificationHref(row)).toBe(`${path}?notification=notification`);
    }
  });
  it("leaves unread receipts alone on launch, Home, and account pages", () => {
    for (const path of [
      "/",
      "/groups",
      "/group/home",
      "/profile",
      "/preferences",
      "/create-group",
    ]) {
      expect(notificationVisit(path)).toBeNull();
    }
  });
  it("keeps nested navigation within its section, and Home destinations separate", () => {
    expect(notificationVisit("/group/calendar/event")).toEqual({
      projectId: "group",
      section: "calendar",
    });
    expect(notificationVisit("/group/lists/templates/template")).toEqual({
      projectId: "group",
      section: "lists",
    });
    expect(notificationVisit("/group/home/notes/note/edit")).toEqual({
      projectId: "group",
      section: "notes",
    });
    expect(notificationVisit("/group/home/files")).toEqual({
      projectId: "group",
      section: "files",
    });
    expect(notificationVisit("/group-settings", "group")).toEqual({
      projectId: "group",
      section: "members",
    });
  });
  it("aggregates Home badges without including Calendar, Lists or Expenses", () => {
    const rows = [
      receipt("notes", 2),
      receipt("files", 3),
      receipt("members"),
      receipt("calendar", 4),
      receipt("lists", 5),
      receipt("expenses", 6),
    ];
    expect(unreadCount(rows, projectId, "home")).toBe(6);
    expect(unreadCount(rows, projectId)).toBe(21);
    expect(unreadCount(rows, projectId, "calendar")).toBe(4);
    expect(unreadCount(rows, "other-group")).toBe(0);
  });
});
