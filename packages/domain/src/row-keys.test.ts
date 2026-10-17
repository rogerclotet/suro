import { describe, expect, it } from "vitest";
import { listItemSignature, type RowKeys, reconcileRowKeys } from "./row-keys";

const row = (id: string, name: string, category?: string) => ({
  id,
  signature: listItemSignature({ name, category }),
});

const keysOf = (keys: RowKeys) =>
  Object.fromEntries([...keys].map(([id, { key }]) => [id, key]));

describe("reconcileRowKeys", () => {
  it("keys new rows by their own id", () => {
    const keys = reconcileRowKeys(new Map(), [
      row("a", "Milk"),
      row("b", "Eggs"),
    ]);
    expect(keysOf(keys)).toEqual({ a: "a", b: "b" });
  });

  it("lets the server row inherit the placeholder's key", () => {
    const optimistic = reconcileRowKeys(new Map(), [
      row("a", "Milk"),
      row("temp-1", "Bread"),
    ]);
    const confirmed = reconcileRowKeys(optimistic, [
      row("a", "Milk"),
      row("server-1", "Bread"),
    ]);
    expect(keysOf(confirmed)).toEqual({ a: "a", "server-1": "temp-1" });
  });

  it("keeps the key across replays that regenerate the placeholder id", () => {
    let keys = reconcileRowKeys(new Map(), [row("temp-1", "Bread")]);
    keys = reconcileRowKeys(keys, [row("temp-2", "Bread")]);
    keys = reconcileRowKeys(keys, [row("server-1", "Bread")]);
    expect(keysOf(keys)).toEqual({ "server-1": "temp-1" });
  });

  it("pairs concurrent placeholders by signature", () => {
    const optimistic = reconcileRowKeys(new Map(), [
      row("temp-1", "Bread"),
      row("temp-2", "Dates"),
    ]);
    // The first create lands while the second is replayed under a new id.
    const next = reconcileRowKeys(optimistic, [
      row("temp-3", "Dates"),
      row("server-1", "Bread"),
    ]);
    expect(keysOf(next)).toEqual({ "temp-3": "temp-2", "server-1": "temp-1" });
  });

  it("does not match rows in another category", () => {
    const optimistic = reconcileRowKeys(new Map(), [
      row("temp-1", "Rope", "Gear"),
    ]);
    const next = reconcileRowKeys(optimistic, [row("server-1", "Rope")]);
    expect(keysOf(next)).toEqual({ "server-1": "server-1" });
  });

  it("forgets keys of removed rows", () => {
    const before = reconcileRowKeys(new Map(), [
      row("a", "Milk"),
      row("b", "Eggs"),
    ]);
    const after = reconcileRowKeys(before, [row("a", "Milk")]);
    expect(keysOf(after)).toEqual({ a: "a" });
    // A later row with the removed row's signature is a new row.
    expect(
      keysOf(reconcileRowKeys(after, [row("a", "Milk"), row("c", "Eggs")])),
    ).toEqual({
      a: "a",
      c: "c",
    });
  });

  it("returns the previous map when nothing changed", () => {
    const keys = reconcileRowKeys(new Map(), [row("a", "Milk")]);
    expect(reconcileRowKeys(keys, [row("a", "Milk")])).toBe(keys);
  });

  it("returns a new map when a row is renamed", () => {
    const keys = reconcileRowKeys(new Map(), [row("a", "Milk")]);
    const renamed = reconcileRowKeys(keys, [row("a", "Oat milk")]);
    expect(renamed).not.toBe(keys);
    expect(keysOf(renamed)).toEqual({ a: "a" });
  });

  it("never hands out the same key twice", () => {
    let keys = reconcileRowKeys(new Map(), [row("temp-1", "Bread")]);
    keys = reconcileRowKeys(keys, [row("server-1", "Bread")]);
    // A fresh row whose id equals the key server-1 inherited cannot share it.
    const next = reconcileRowKeys(keys, [
      row("temp-1", "Other"),
      row("server-1", "Bread"),
    ]);
    expect(keysOf(next)).toEqual({
      "temp-1": "temp-1~1",
      "server-1": "temp-1",
    });
  });
});

describe("listItemSignature", () => {
  it("ignores surrounding whitespace and a missing category", () => {
    expect(listItemSignature({ name: " Milk ", category: " " })).toBe(
      listItemSignature({ name: "Milk", category: null }),
    );
  });
});
