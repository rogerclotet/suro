import type { Value } from "convex/values";
import { Platform } from "react-native";
import { deserialize, serialize } from "./serialization";

/**
 * Synchronous key→string storage backing the offline layer. Synchronous reads
 * are the point: the cache must return last-seen data on the first render frame
 * of an offline cold start. Native uses MMKV; web (dev only, react-native-web)
 * falls back to localStorage so `expo start --web` doesn't crash on the
 * native-only module.
 */
type KVStore = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  getAllKeys: () => string[];
};

function createStore(): KVStore {
  if (Platform.OS === "web") {
    const ls: Storage | undefined = globalThis.localStorage;
    if (ls === undefined) {
      const mem = new Map<string, string>();
      return {
        getString: (k) => mem.get(k),
        set: (k, v) => void mem.set(k, v),
        delete: (k) => void mem.delete(k),
        getAllKeys: () => [...mem.keys()],
      };
    }
    return {
      getString: (k) => ls.getItem(k) ?? undefined,
      set: (k, v) => ls.setItem(k, v),
      delete: (k) => ls.removeItem(k),
      getAllKeys: () => Object.keys(ls),
    };
  }
  // Required lazily so the native module is only touched on native platforms.
  // MMKV v4 (Nitro): a `createMMKV` factory + `remove` (no `new`/`delete`).
  const { createMMKV } =
    require("react-native-mmkv") as typeof import("react-native-mmkv");
  const mmkv = createMMKV({ id: "suro-offline" });
  return {
    getString: (k) => mmkv.getString(k),
    set: (k, v) => mmkv.set(k, v),
    delete: (k) => mmkv.remove(k),
    getAllKeys: () => mmkv.getAllKeys(),
  };
}

let store: KVStore | null = null;
function kv(): KVStore {
  if (store === null) {
    store = createStore();
  }
  return store;
}

// Bump when cached query shapes change. Outbox migration is independent.
const CACHE_VERSION = "1";
let cacheVersionChecked = false;
function ensureCacheVersion() {
  if (cacheVersionChecked) return;
  if (kv().getString("cache:version") !== CACHE_VERSION) {
    clearQueryCache();
    kv().set("cache:version", CACHE_VERSION);
  }
  cacheVersionChecked = true;
}
const QUERY_PREFIX = "q:";
const INDEX_KEY = "q:__index__";
/** Cap on distinct cached query keys; oldest-inserted are evicted past this. */
const MAX_QUERY_KEYS = 500;

let knownKeys: string[] | null = null;

function loadIndex(): string[] {
  if (knownKeys === null) {
    const raw = kv().getString(INDEX_KEY);
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      knownKeys =
        Array.isArray(parsed) &&
        parsed.every((key): key is string => typeof key === "string")
          ? parsed
          : [];
    } catch {
      knownKeys = [];
    }
  }
  return knownKeys;
}

function persistIndex(): void {
  kv().set(INDEX_KEY, JSON.stringify(knownKeys ?? []));
}

/** Read a cached query result, or `undefined` on miss / corrupt entry. */
export function cacheGet(key: string): unknown {
  ensureCacheVersion();
  const raw = kv().getString(key);
  if (raw === undefined) {
    return undefined;
  }
  try {
    return deserialize(raw);
  } catch {
    return undefined;
  }
}

/**
 * Write a query result. The key index is only rewritten when a new (fn, args)
 * shape first appears — repeated reactive updates to the same query just rewrite
 * the value — so index churn stays low. Oldest-inserted keys evict past the cap.
 */
export function cacheSet(key: string, value: unknown): void {
  ensureCacheVersion();
  let serialized: string;
  try {
    serialized = serialize(value as Value);
  } catch {
    return; // never let a serialization edge case break the read path
  }
  kv().set(key, serialized);
  const index = loadIndex();
  if (!index.includes(key)) {
    index.push(key);
    while (index.length > MAX_QUERY_KEYS) {
      const evicted = index.shift();
      if (evicted !== undefined) {
        kv().delete(evicted);
      }
    }
    persistIndex();
  }
}

/** Raw string slot for the outbox/meta keys (not part of the query cache). */
export function readRaw(key: string): string | undefined {
  return kv().getString(key);
}

export function writeRaw(key: string, value: string): void {
  kv().set(key, value);
}

export function deleteRaw(key: string): void {
  kv().delete(key);
}

/** Drop the whole query cache (e.g. on sign-out); leaves outbox keys intact. */
export function clearQueryCache(): void {
  for (const key of kv().getAllKeys()) {
    if (key.startsWith(QUERY_PREFIX)) {
      kv().delete(key);
    }
  }
  knownKeys = [];
}
