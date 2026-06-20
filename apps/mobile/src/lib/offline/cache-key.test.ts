import { describe, expect, it } from "vitest";
import { cacheKey, canonicalize } from "./cache-key";

describe("canonicalize", () => {
  it("sorts object keys recursively", () => {
    const a = canonicalize({ b: 1, a: { d: 2, c: 3 } });
    const b = canonicalize({ a: { c: 3, d: 2 }, b: 1 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("preserves array order", () => {
    expect(canonicalize([3, 1, 2])).toEqual([3, 1, 2]);
  });

  it("passes primitives through", () => {
    expect(canonicalize(null)).toBe(null);
    expect(canonicalize(42)).toBe(42);
    expect(canonicalize("x")).toBe("x");
  });
});

describe("cacheKey", () => {
  it("is independent of arg key order", () => {
    expect(
      cacheKey("lists:overviewByProject", { projectId: "p", limit: 5 }),
    ).toBe(cacheKey("lists:overviewByProject", { limit: 5, projectId: "p" }));
  });

  it("differs by function name and by args", () => {
    expect(cacheKey("lists:get", { listId: "a" })).not.toBe(
      cacheKey("lists:get", { listId: "b" }),
    );
    expect(cacheKey("a", { x: 1 })).not.toBe(cacheKey("b", { x: 1 }));
  });

  it("treats a no-arg call and an empty-args call as the same query", () => {
    expect(cacheKey("users:me", undefined)).toBe("q:users:me:{}");
    expect(cacheKey("users:me", undefined)).toBe(cacheKey("users:me", {}));
  });
});
