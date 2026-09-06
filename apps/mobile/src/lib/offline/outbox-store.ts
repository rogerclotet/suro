import { useSyncExternalStore } from "react";
import { createOutboxStore } from "./outbox-core";
import { deleteRaw, readRaw, writeRaw } from "./storage";

export const outbox = createOutboxStore({
  read: readRaw,
  write: writeRaw,
  remove: deleteRaw,
});
export function useOutboxEntries() {
  return useSyncExternalStore(
    outbox.subscribe,
    outbox.getEntries,
    outbox.getEntries,
  );
}
export function useIdmap() {
  return useSyncExternalStore(
    outbox.subscribe,
    outbox.getIdmap,
    outbox.getIdmap,
  );
}
export function useQuarantinedEntries() {
  return useSyncExternalStore(
    outbox.subscribe,
    outbox.getQuarantined,
    outbox.getQuarantined,
  );
}
