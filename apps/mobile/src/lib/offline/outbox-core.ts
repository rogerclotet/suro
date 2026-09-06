import { dependentEntryIds } from "./outbox-logic";
import {
  decodeOutbox,
  emptyOutbox,
  migrateLegacy,
  readJson,
  type SavedOutbox,
} from "./persistence";
import type { IdMap, OutboxEntry, TempId } from "./types";

export type RawStorage = {
  read: (key: string) => string | undefined;
  write: (key: string, value: string) => void;
  remove: (key: string) => void;
};
const KEY = "outbox:v1";

/** One atomic persisted snapshot owns entries, acknowledgements and account identity. */
export function createOutboxStore(storage: RawStorage) {
  let state: SavedOutbox | undefined;
  let accountEpoch = 0;
  const listeners = new Set<() => void>();
  function getState(): SavedOutbox {
    if (state) return state;
    const raw = storage.read(KEY);
    if (raw !== undefined) state = decodeOutbox(readJson(raw));
    else if (
      ["outbox", "outbox:idmap", "outbox:meta"].some(
        (key) => storage.read(key) !== undefined,
      )
    ) {
      const migrated = migrateLegacy(
        readJson(storage.read("outbox")),
        readJson(storage.read("outbox:idmap")),
        readJson(storage.read("outbox:meta")),
      );
      storage.write(KEY, JSON.stringify(migrated));
      state = migrated;
      for (const key of ["outbox", "outbox:idmap", "outbox:meta"])
        storage.remove(key);
    } else state = emptyOutbox();
    return state;
  }
  function save(next: SavedOutbox) {
    // A failed disk write must not acknowledge that a change has been saved.
    storage.write(KEY, JSON.stringify(next));
    state = next;
    for (const listener of listeners) listener();
  }
  function getEntries() {
    return getState().entries;
  }
  function replaceEntries(entries: OutboxEntry[]) {
    save({ ...getState(), entries });
  }
  function acknowledge(entryId: string, tempId?: string, realId?: string) {
    const current = getState();
    const idmap: IdMap =
      tempId && realId ? { ...current.idmap, [tempId]: realId } : current.idmap;
    save({
      ...current,
      idmap,
      entries: current.entries.filter((entry) => entry.id !== entryId),
    });
  }
  function retry(entryId: string) {
    const ids = dependentEntryIds(getEntries(), entryId);
    replaceEntries(
      getEntries().map((entry) => {
        if (!ids.has(entry.id) || entry.status !== "failed") return entry;
        const { lastError: _, ...rest } = entry;
        return { ...rest, status: "pending" };
      }),
    );
  }
  function discard(entryId: string) {
    const ids = dependentEntryIds(getEntries(), entryId);
    replaceEntries(getEntries().filter((entry) => !ids.has(entry.id)));
  }
  function setUserId(userId: string) {
    const current = getState();
    if (current.userId === userId) return;
    save({ ...(current.userId === null ? current : emptyOutbox()), userId });
    accountEpoch++;
  }
  function allocTempId(table: string): TempId {
    const current = getState();
    const counter = current.counter + 1;
    save({ ...current, counter });
    return `temp-${table}-${counter}`;
  }
  return {
    getEntries,
    getState,
    getAccountEpoch: () => accountEpoch,
    getIdmap: () => getState().idmap,
    getUserId: () => getState().userId,
    getQuarantined: () => getState().quarantined,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    enqueue(entry: OutboxEntry) {
      replaceEntries([...getEntries(), entry]);
    },
    replaceEntries,
    acknowledge,
    retry,
    discard,
    setUserId,
    allocTempId,
    clearOutbox() {
      save(emptyOutbox());
      accountEpoch++;
    },
    discardQuarantined() {
      save({ ...getState(), quarantined: [] });
    },
  };
}
export type OutboxStore = ReturnType<typeof createOutboxStore>;
