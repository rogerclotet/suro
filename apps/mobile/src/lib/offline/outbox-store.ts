import { useSyncExternalStore } from "react";
import { deleteRaw, readRaw, writeRaw } from "./storage";
import type { IdMap, OutboxEntry } from "./types";

/**
 * The persisted offline write queue, as a tiny subscribable store. Reads/writes
 * are synchronous (MMKV-backed); React components subscribe via
 * `useSyncExternalStore` so a queued or flushed write re-renders the overlay.
 * Snapshots keep stable identity until mutated, as `useSyncExternalStore`
 * requires.
 */
const OUTBOX_KEY = "outbox";
const IDMAP_KEY = "outbox:idmap";
const META_KEY = "outbox:meta";

type Meta = { counter: number; userId: string | null };

let entries: OutboxEntry[] | null = null;
let idmap: IdMap | null = null;
let meta: Meta | null = null;
const listeners = new Set<() => void>();

function load<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === undefined) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getEntries(): OutboxEntry[] {
  if (entries === null) {
    entries = load<OutboxEntry[]>(OUTBOX_KEY, []);
  }
  return entries;
}

function getIdmap(): IdMap {
  if (idmap === null) {
    idmap = load<IdMap>(IDMAP_KEY, {});
  }
  return idmap;
}

function getMeta(): Meta {
  if (meta === null) {
    meta = load<Meta>(META_KEY, { counter: 0, userId: null });
  }
  return meta;
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function persistEntries(next: OutboxEntry[]): void {
  entries = next;
  writeRaw(OUTBOX_KEY, JSON.stringify(next));
  notify();
}

function persistIdmap(next: IdMap): void {
  idmap = next;
  writeRaw(IDMAP_KEY, JSON.stringify(next));
  notify();
}

function persistMeta(next: Meta): void {
  meta = next;
  writeRaw(META_KEY, JSON.stringify(next));
}

/** Append a queued mutation. */
function enqueue(entry: OutboxEntry): void {
  persistEntries([...getEntries(), entry]);
}

/** Replace the whole queue (used by the flusher after compaction/removal). */
function replaceEntries(next: OutboxEntry[]): void {
  persistEntries(next);
}

/** Record a resolved temp→server id mapping; persisted immediately. */
function resolveTempId(tempId: string, realId: string): void {
  persistIdmap({ ...getIdmap(), [tempId]: realId });
}

/** Allocate a fresh, restart-stable temp id for a newly created entity. */
function allocTempId(table: string): string {
  const next = getMeta().counter + 1;
  persistMeta({ ...getMeta(), counter: next });
  return `temp-${table}-${next}`;
}

function getUserId(): string | null {
  return getMeta().userId;
}

function setUserId(userId: string): void {
  if (getMeta().userId !== userId) {
    persistMeta({ ...getMeta(), userId });
  }
}

/** Wipe the queue + id map (sign-out, or a different user owns the device). */
function clearOutbox(): void {
  deleteRaw(OUTBOX_KEY);
  deleteRaw(IDMAP_KEY);
  entries = [];
  idmap = {};
  persistMeta({ ...getMeta(), userId: null });
  notify();
}

export const outbox = {
  getEntries,
  getIdmap,
  subscribe,
  enqueue,
  replaceEntries,
  resolveTempId,
  allocTempId,
  getUserId,
  setUserId,
  clearOutbox,
};

/** Reactive view of the pending queue for overlay-aware read hooks. */
export function useOutboxEntries(): OutboxEntry[] {
  return useSyncExternalStore(subscribe, getEntries, getEntries);
}

/** Reactive view of the temp→server id map. */
export function useIdmap(): IdMap {
  return useSyncExternalStore(subscribe, getIdmap, getIdmap);
}
