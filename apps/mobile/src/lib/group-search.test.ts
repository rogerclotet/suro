import { describe, expect, it } from "vitest";
import { matchesGroupSearch } from "./group-search";

const group = {
  name: "Vacances d'estiu",
  members: [
    { name: "Anna" },
    { name: "Pau" },
    { name: null },
    { name: "José Pérez" },
  ],
};

describe("group search", () => {
  it.each([
    "",
    "  ",
    "VACANCES",
    "estiu",
    "anna",
    "jose",
    "perez",
    "  Estiu   José  ",
  ])("matches group and all member names for %j", (query) => {
    expect(matchesGroupSearch(group, query)).toBe(true);
  });

  it.each(["Winter", "Anna Winter", "null"])(
    "excludes nonmatches for %j",
    (query) => {
      expect(matchesGroupSearch(group, query)).toBe(false);
    },
  );

  it("filters the displayed list without changing activity order", () => {
    const groups = [
      group,
      { name: "Work", members: [{ name: "Anna" }] },
      { name: "Other", members: [] },
    ];
    expect(groups.filter((entry) => matchesGroupSearch(entry, "Anna"))).toEqual(
      groups.slice(0, 2),
    );
    expect(groups).toHaveLength(3);
  });
});
