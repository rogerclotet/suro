import { describe, expect, it } from "vitest";
import { groupHeaderRoute } from "./group-header-route";

const TABS = ["home", "lists", "calendar", "expenses"];
const GROUP = "/groups/[projectId]";

describe("group header route", () => {
  it("names the group on the bottom-bar sections", () => {
    for (const tab of TABS) {
      expect(groupHeaderRoute(`${GROUP}/${tab}`, TABS)).toEqual({
        kind: "tab",
      });
    }
  });

  it("goes back to Home from the sections Home opens and from settings", () => {
    for (const [section, titleKey] of [
      ["files", "files"],
      ["notes", "notes"],
      ["secret-santa", "secretSanta"],
      ["settings", "settings"],
    ]) {
      expect(groupHeaderRoute(`${GROUP}/${section}`, TABS)).toEqual({
        kind: "nested",
        parent: `${GROUP}/home`,
        titleKey,
      });
    }
  });

  it("goes back one level from deeper pages, titled by their section", () => {
    const cases: [string, string, string][] = [
      ["lists/[listId]", "lists", "lists"],
      ["lists/tasks", "lists", "lists"],
      ["lists/templates", "lists", "templates"],
      ["lists/templates/[templateId]", "lists/templates", "templates"],
      ["calendar/[eventId]", "calendar", "calendar"],
      ["expenses/[potId]", "expenses", "expenses"],
      ["notes/[noteId]/edit", "notes/[noteId]", "notes"],
      ["secret-santa/ideas", "secret-santa", "ideas"],
    ];
    for (const [path, parent, titleKey] of cases) {
      expect(groupHeaderRoute(`${GROUP}/${path}`, TABS)).toEqual({
        kind: "nested",
        parent: `${GROUP}/${parent}`,
        titleKey,
      });
    }
  });

  it("falls back to Home when the parent isn't a page", () => {
    expect(groupHeaderRoute(`${GROUP}/invitation/[inviteToken]`, TABS)).toEqual(
      { kind: "nested", parent: `${GROUP}/home`, titleKey: null },
    );
  });

  it("leaves pages outside a group alone", () => {
    expect(groupHeaderRoute("/groups", TABS)).toBeNull();
    expect(groupHeaderRoute("/profile", TABS)).toBeNull();
  });
});
