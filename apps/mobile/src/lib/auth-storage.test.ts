import { describe, expect, it, vi } from "vitest";
import {
  convexAuthSessionKeys,
  createAuthStorage,
  isKeychainLockedError,
  type SecureKeyStore,
} from "./auth-storage";

const LOCKED = new Error(
  "Calling the 'setValueWithKeyAsync' function has failed\n→ Caused by: KeyChainException: User interaction is not allowed.",
);

type FakeStore = SecureKeyStore & {
  items: Map<string, string>;
  locked: boolean;
};

function fakeStore(entries: Record<string, string> = {}): FakeStore {
  const fake: FakeStore = {
    items: new Map(Object.entries(entries)),
    locked: false,
    getItem: async (key) => {
      if (fake.locked) throw LOCKED;
      return fake.items.get(key) ?? null;
    },
    setItem: async (key, value) => {
      if (fake.locked) throw LOCKED;
      fake.items.set(key, value);
    },
    removeItem: async (key) => {
      if (fake.locked) throw LOCKED;
      fake.items.delete(key);
    },
  };
  return fake;
}

describe("createAuthStorage", () => {
  it("keeps a write that failed while locked and serves it to reads", async () => {
    const store = fakeStore({ refresh: "spent" });
    const onWriteError = vi.fn();
    const storage = createAuthStorage({ store, onWriteError });

    store.locked = true;
    await expect(
      storage.setItem("refresh", "rotated"),
    ).resolves.toBeUndefined();

    expect(onWriteError).toHaveBeenCalledWith(LOCKED);
    expect(await storage.getItem("refresh")).toBe("rotated");
  });

  it("persists the pending write once flushed after unlock", async () => {
    const store = fakeStore({ refresh: "spent" });
    const storage = createAuthStorage({ store, onWriteError: vi.fn() });

    store.locked = true;
    await storage.setItem("refresh", "rotated");
    await storage.flushPendingWrites();
    expect(store.items.get("refresh")).toBe("spent");

    store.locked = false;
    await storage.flushPendingWrites();
    expect(store.items.get("refresh")).toBe("rotated");
  });

  it("keeps a pending removal so a signed-out token isn't read back", async () => {
    const store = fakeStore({ jwt: "old" });
    const storage = createAuthStorage({ store, onWriteError: vi.fn() });

    store.locked = true;
    await storage.removeItem("jwt");
    store.locked = false;

    expect(await storage.getItem("jwt")).toBeNull();
    await storage.flushPendingWrites();
    expect(store.items.has("jwt")).toBe(false);
  });

  it("lets a newer write win over a pending retry", async () => {
    const store = fakeStore();
    const storage = createAuthStorage({ store, onWriteError: vi.fn() });

    store.locked = true;
    await storage.setItem("refresh", "first");
    store.locked = false;
    await storage.setItem("refresh", "second");
    await storage.flushPendingWrites();

    expect(store.items.get("refresh")).toBe("second");
  });

  it("propagates read failures instead of reporting a missing token", async () => {
    const store = fakeStore({ refresh: "token" });
    const storage = createAuthStorage({ store, onWriteError: vi.fn() });

    store.locked = true;
    await expect(storage.getItem("refresh")).rejects.toBe(LOCKED);
  });

  it("moves a legacy item into the new store on read", async () => {
    const store = fakeStore();
    const legacyStore = fakeStore({ jwt: "token" });
    const storage = createAuthStorage({
      store,
      legacyStore,
      onWriteError: vi.fn(),
    });

    expect(await storage.getItem("jwt")).toBe("token");
    expect(store.items.get("jwt")).toBe("token");
    expect(legacyStore.items.has("jwt")).toBe(false);
  });

  it("prefers the new store over a leftover legacy item", async () => {
    const store = fakeStore({ jwt: "new" });
    const legacyStore = fakeStore({ jwt: "old" });
    const storage = createAuthStorage({
      store,
      legacyStore,
      onWriteError: vi.fn(),
    });

    expect(await storage.getItem("jwt")).toBe("new");
  });

  it("keeps the legacy copy when the new store can't take it", async () => {
    const store = fakeStore();
    store.setItem = async () => {
      throw LOCKED;
    };
    const legacyStore = fakeStore({ jwt: "token" });
    const storage = createAuthStorage({
      store,
      legacyStore,
      onWriteError: vi.fn(),
    });

    expect(await storage.getItem("jwt")).toBe("token");
    expect(legacyStore.items.get("jwt")).toBe("token");
  });

  it("removes the legacy copy too, so sign-out can't be undone by migration", async () => {
    const store = fakeStore({ jwt: "new" });
    const legacyStore = fakeStore({ jwt: "old" });
    const storage = createAuthStorage({
      store,
      legacyStore,
      onWriteError: vi.fn(),
    });

    await storage.removeItem("jwt");

    expect(await storage.getItem("jwt")).toBeNull();
    expect(legacyStore.items.has("jwt")).toBe(false);
  });

  it("migrates the listed keys eagerly", async () => {
    const store = fakeStore();
    const legacyStore = fakeStore({ jwt: "a", refresh: "b", other: "c" });
    const storage = createAuthStorage({
      store,
      legacyStore,
      onWriteError: vi.fn(),
    });

    await storage.migrateLegacy(["jwt", "refresh"]);

    expect(Object.fromEntries(store.items)).toEqual({ jwt: "a", refresh: "b" });
    expect([...legacyStore.items.keys()]).toEqual(["other"]);
  });
});

describe("convexAuthSessionKeys", () => {
  it("suffixes the Convex Auth keys with the alphanumeric namespace", () => {
    expect(
      convexAuthSessionKeys("https://happy-otter-123.convex.cloud"),
    ).toEqual([
      "__convexAuthJWT_httpshappyotter123convexcloud",
      "__convexAuthRefreshToken_httpshappyotter123convexcloud",
    ]);
  });
});

describe("isKeychainLockedError", () => {
  it("recognizes errSecInteractionNotAllowed", () => {
    expect(isKeychainLockedError(LOCKED)).toBe(true);
    expect(isKeychainLockedError(new Error("I/O error."))).toBe(false);
    expect(isKeychainLockedError("User interaction is not allowed")).toBe(
      false,
    );
  });
});
