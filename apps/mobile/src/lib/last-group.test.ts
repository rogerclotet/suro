import { beforeEach, describe, expect, it, vi } from "vitest";
import { forgetGroup, lastGroupId, rememberGroup } from "./last-group";

const store = vi.hoisted(() => new Map<string, string>());
vi.mock("./offline/storage", () => ({
  QUERY_PREFIX: "q:",
  readRaw: (key: string) => store.get(key),
  writeRaw: (key: string, value: string) => store.set(key, value),
  deleteRaw: (key: string) => store.delete(key),
}));

beforeEach(() => store.clear());

describe("last group", () => {
  it("remembers the group launch reopens, under the account-cleared prefix", () => {
    expect(lastGroupId()).toBeUndefined();
    rememberGroup("flat");
    rememberGroup("family");
    expect(lastGroupId()).toBe("family");
    expect([...store.keys()].every((key) => key.startsWith("q:"))).toBe(true);
  });

  it("forgets only the group the user left", () => {
    rememberGroup("family");
    forgetGroup("flat");
    expect(lastGroupId()).toBe("family");
    forgetGroup("family");
    expect(lastGroupId()).toBeUndefined();
  });
});
