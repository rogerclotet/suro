// @vitest-environment jsdom

import type { Id } from "backend/convex/_generated/dataModel";
import { getFunctionName } from "convex/server";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createOutboxStore } from "./outbox-core";
import { entry } from "./test-fixtures";

const boundary = vi.hoisted(() => ({ read: vi.fn() }));
const data = new Map<string, string>();
const queue = createOutboxStore({
  read: (key) => data.get(key),
  write: (key, value) => {
    data.set(key, value);
  },
  remove: (key) => {
    data.delete(key);
  },
});
vi.mock("./use-persistent-query", () => ({
  usePersistentQuery: (...args: unknown[]) => boundary.read(...args),
}));
vi.mock("./outbox-store", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useOutboxEntries: () =>
      useSyncExternalStore(queue.subscribe, queue.getEntries),
    useIdmap: () => useSyncExternalStore(queue.subscribe, queue.getIdmap),
  };
});

import { useOfflineGetPot, useOfflineListGet } from "./queries";

let root: Root;
let result: {
  list: ReturnType<typeof useOfflineListGet>;
  pot: ReturnType<typeof useOfflineGetPot>;
};
function Probe() {
  result = {
    list: useOfflineListGet("temp-list" as Id<"lists">),
    pot: useOfflineGetPot("temp-pot" as Id<"pots">),
  };
  return null;
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  root = createRoot(document.createElement("div"));
});
afterEach(async () => {
  await act(async () => root.unmount());
  queue.clearOutbox();
  boundary.read.mockReset();
  vi.unstubAllGlobals();
});

it("skips unresolved route IDs, then subscribes using their acknowledged server IDs", async () => {
  queue.setUserId("user");
  queue.enqueue(
    entry({
      id: "list-create",
      functionName: "lists:create",
      args: { name: "Offline list" },
      tempIds: ["temp-list"],
    }),
  );
  queue.enqueue(
    entry({
      id: "pot-create",
      functionName: "expenses:createPot",
      args: { name: "Offline pot" },
      tempIds: ["temp-pot"],
    }),
  );
  boundary.read.mockImplementation((query, args) => {
    if (args === "skip") return undefined;
    if (getFunctionName(query) === "users:me")
      return { _id: "user", name: "Alice" };
    if (getFunctionName(query) === "projects:members") return [];
    return undefined;
  });
  await act(async () => root.render(createElement(Probe)));
  expect(result.list?.name).toBe("Offline list");
  expect(result.pot?.name).toBe("Offline pot");
  const detailArgs = () =>
    boundary.read.mock.calls
      .filter(([query]) =>
        ["lists:get", "expenses:getPot"].includes(getFunctionName(query)),
      )
      .map(([, args]) => args);
  expect(detailArgs().every((args) => args === "skip")).toBe(true);
  boundary.read.mockClear();
  await act(async () => {
    queue.acknowledge("list-create", "temp-list", "real-list");
    queue.acknowledge("pot-create", "temp-pot", "real-pot");
  });
  expect(detailArgs()).toContainEqual({ listId: "real-list" });
  expect(detailArgs()).toContainEqual({ potId: "real-pot" });
});
