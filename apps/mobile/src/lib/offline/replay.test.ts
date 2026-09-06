import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { createOutboxStore, type RawStorage } from "./outbox-core";
import { createFlusher } from "./replay";
import { entry } from "./test-fixtures";

function memory() {
  const data = new Map<string, string>();
  const storage: RawStorage = {
    read: (key) => data.get(key),
    write: (key, value) => {
      data.set(key, value);
    },
    remove: (key) => {
      data.delete(key);
    },
  };
  const queue = createOutboxStore(storage);
  queue.setUserId("u1");
  return { data, storage, queue };
}
function chain(queue: ReturnType<typeof createOutboxStore>) {
  queue.enqueue(
    entry({
      id: "parent",
      functionName: "lists:create",
      args: { name: "Groceries" },
      tempIds: ["temp-list"],
    }),
  );
  queue.enqueue(
    entry({
      id: "child",
      functionName: "listItems:create",
      args: { listId: "temp-list", name: "Milk" },
      tempIds: ["temp-item"],
    }),
  );
  queue.enqueue(
    entry({
      id: "grandchild",
      functionName: "listItems:setCategory",
      args: { itemId: "temp-item", category: "Fridge" },
    }),
  );
}

describe("durable replay", () => {
  it("restarts and remaps a dependency chain, persisting each acknowledgement atomically", async () => {
    const { queue, storage } = memory();
    chain(queue);
    const restarted = createOutboxStore(storage);
    const sent: unknown[] = [];
    await createFlusher({
      queue: restarted,
      currentUserId: () => "u1",
      isOnline: () => true,
      send: async (operation) => {
        sent.push(operation.args);
        return operation.functionName === "lists:create"
          ? "real-list"
          : "real-item";
      },
    })();
    expect(sent).toEqual([
      { name: "Groceries", projectId: "project-1" },
      { listId: "real-list", name: "Milk" },
      { itemId: "real-item", category: "Fridge" },
    ]);
    const saved = createOutboxStore(storage);
    expect(saved.getEntries()).toEqual([]);
    expect(saved.getIdmap()).toEqual({
      "temp-list": "real-list",
      "temp-item": "real-item",
    });
  });

  it("retains a failed parent and dependents across restart, then retries or discards the whole chain", async () => {
    const { queue, storage } = memory();
    chain(queue);
    await createFlusher({
      queue,
      currentUserId: () => "u1",
      isOnline: () => true,
      send: async () => {
        throw new Error("Permission changed");
      },
    })();
    const restarted = createOutboxStore(storage);
    expect(restarted.getEntries().map((row) => row.status)).toEqual([
      "failed",
      "failed",
      "failed",
    ]);
    restarted.retry("parent");
    expect(
      restarted.getEntries().every((row) => row.status === "pending"),
    ).toBe(true);
    restarted.discard("parent");
    expect(createOutboxStore(storage).getEntries()).toEqual([]);
  });

  it("only acknowledges structured missing-target errors for deletes", async () => {
    const { queue } = memory();
    queue.enqueue(
      entry({
        id: "delete",
        functionName: "lists:remove",
        args: { listId: "gone" },
      }),
    );
    queue.enqueue(
      entry({
        id: "edit",
        functionName: "lists:update",
        args: { listId: "gone", name: "Edit" },
      }),
    );
    await createFlusher({
      queue,
      currentUserId: () => "u1",
      isOnline: () => true,
      send: async () => {
        throw new ConvexError({ code: "NOT_FOUND", message: "List not found" });
      },
    })();
    expect(queue.getEntries()).toMatchObject([
      { id: "edit", status: "failed" },
    ]);
  });

  it("does not replay without confirmed identity or acknowledge an old account's in-flight result", async () => {
    const { queue } = memory();
    chain(queue);
    let owner: string | null = null;
    let finish: ((value: string) => void) | undefined;
    let calls = 0;
    const flush = createFlusher({
      queue,
      currentUserId: () => owner,
      isOnline: () => true,
      send: () => {
        calls++;
        return new Promise<string>((resolve) => {
          finish = resolve;
        });
      },
    });
    await flush();
    expect(calls).toBe(0);
    owner = "u1";
    const running = flush();
    owner = "u2";
    queue.setUserId(owner);
    finish?.("old-result");
    await running;
    expect(queue.getUserId()).toBe("u2");
    expect(queue.getIdmap()).toEqual({});
    expect(queue.getEntries()).toEqual([]);
  });

  it("migrates legacy updates and preserves unknown operations for recovery", () => {
    const { data, storage } = memory();
    data.delete("outbox:v1");
    data.set(
      "outbox",
      JSON.stringify([
        entry({
          functionName: "listItems:update",
          args: { itemId: "item", name: "Renamed", completed: false },
        }),
        { functionName: "future:command", args: {} },
      ]),
    );
    data.set("outbox:meta", JSON.stringify({ userId: "u1", counter: 12 }));
    const queue = createOutboxStore(storage);
    expect(queue.getEntries()).toHaveLength(1);
    expect(queue.getQuarantined()).toHaveLength(1);
    expect(data.has("outbox")).toBe(false);
    expect(createOutboxStore(storage).getQuarantined()).toHaveLength(1);
  });

  it("retains corrupt/future snapshots and refuses to acknowledge failed disk writes", () => {
    const { data, storage } = memory();
    for (const raw of [
      "{broken",
      JSON.stringify({ version: 99, entries: ["keep"] }),
    ]) {
      data.set("outbox:v1", raw);
      const queue = createOutboxStore(storage);
      expect(queue.getQuarantined()).toHaveLength(1);
      expect(queue.getEntries()).toEqual([]);
    }
    data.delete("outbox:v1");
    const queue = createOutboxStore({
      ...storage,
      write: () => {
        throw new Error("Disk full");
      },
    });
    expect(() =>
      queue.enqueue(
        entry({ functionName: "lists:remove", args: { listId: "a" } }),
      ),
    ).toThrow("Disk full");
    expect(queue.getEntries()).toEqual([]);
  });
});

it("drains changes enqueued while a previous request is in flight", async () => {
  const { queue } = memory();
  queue.enqueue(
    entry({
      id: "first",
      functionName: "lists:update",
      args: { listId: "list", name: "First" },
    }),
  );
  let finish: (() => void) | undefined;
  const sent: string[] = [];
  const flush = createFlusher({
    queue,
    currentUserId: () => "u1",
    isOnline: () => true,
    send: async (operation) => {
      if (operation.functionName !== "lists:update")
        throw new Error("Unexpected command");
      sent.push(operation.args.name);
      if (sent.length === 1)
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      return null;
    },
  });
  const running = flush();
  queue.enqueue(
    entry({
      id: "second",
      functionName: "lists:update",
      args: { listId: "list", name: "Second" },
    }),
  );
  await flush();
  finish?.();
  await running;
  expect(sent).toEqual(["First", "Second"]);
  expect(queue.getEntries()).toEqual([]);
});

it("rejects an obsolete acknowledgement after switching accounts away and back", async () => {
  const { queue } = memory();
  queue.enqueue(
    entry({
      id: "same-id",
      functionName: "lists:create",
      args: { name: "Old" },
      tempIds: ["temp-list"],
    }),
  );
  let finish: ((value: string) => void) | undefined;
  const flush = createFlusher({
    queue,
    currentUserId: () => "u1",
    isOnline: () => true,
    send: () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  });
  const running = flush();
  queue.setUserId("u2");
  queue.setUserId("u1");
  queue.enqueue(
    entry({
      id: "same-id",
      functionName: "lists:create",
      args: { name: "New" },
      tempIds: ["temp-list"],
    }),
  );
  finish?.("obsolete-real-id");
  await running;
  expect(queue.getEntries()).toHaveLength(1);
  expect(queue.getIdmap()).toEqual({});
});

it("retains legacy ID mappings even when its entries slot is absent", () => {
  const { data, storage } = memory();
  data.delete("outbox:v1");
  data.set("outbox:idmap", JSON.stringify({ "temp-list": "real-list" }));
  data.set("outbox:meta", JSON.stringify({ counter: 12, userId: "u1" }));
  expect(createOutboxStore(storage).getIdmap()).toEqual({
    "temp-list": "real-list",
  });
  expect(createOutboxStore(storage).allocTempId("lists")).toBe("temp-lists-13");
});
