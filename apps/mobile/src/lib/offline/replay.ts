import { ConvexError } from "convex/values";
import { OPERATIONS, type Operation, parseOperation } from "./operations";
import type { OutboxStore } from "./outbox-core";
import { compact, hasUnresolvedTemp, remapArgs } from "./outbox-logic";

function isMissing(error: unknown): boolean {
  if (!(error instanceof ConvexError)) return false;
  const data: unknown = error.data;
  return (
    data !== null &&
    typeof data === "object" &&
    "code" in data &&
    data.code === "NOT_FOUND"
  );
}

/** Replay acknowledged operations in order. Server-side idempotence governs crash retries. */
export function createFlusher({
  queue,
  send,
  isOnline,
  currentUserId,
}: {
  queue: OutboxStore;
  send: (operation: Operation) => Promise<unknown>;
  isOnline: () => boolean;
  currentUserId: () => string | null;
}) {
  let flushing = false;
  return async function flush() {
    const owner = currentUserId();
    if (
      flushing ||
      !isOnline() ||
      owner === null ||
      queue.getUserId() !== owner
    )
      return;
    const accountEpoch = queue.getAccountEpoch();
    const active = () =>
      isOnline() &&
      currentUserId() === owner &&
      queue.getUserId() === owner &&
      queue.getAccountEpoch() === accountEpoch;
    flushing = true;
    try {
      const entries = compact(queue.getEntries());
      if (entries.length !== queue.getEntries().length)
        queue.replaceEntries(entries);
      while (active()) {
        // Include writes enqueued while a preceding send was in flight.
        const entry = queue
          .getEntries()
          .find((candidate) => candidate.status === "pending");
        if (!entry) break;
        try {
          const args = remapArgs(entry.args, queue.getIdmap());
          if (hasUnresolvedTemp(args))
            throw new Error("A preceding change has not synced");
          const operation = parseOperation(entry.functionName, args);
          const result = await send(operation);
          if (!active()) break;
          queue.acknowledge(
            entry.id,
            entry.tempIds[0],
            typeof result === "string" ? result : undefined,
          );
        } catch (error) {
          if (!active()) break;
          // Only a delete of an absent target counts as an acknowledged no-op.
          if (
            OPERATIONS[entry.functionName].kind === "delete" &&
            isMissing(error)
          ) {
            queue.acknowledge(entry.id);
          } else {
            const lastError =
              error instanceof Error ? error.message : "Sync failed";
            queue.replaceEntries(
              queue.getEntries().map((candidate) =>
                candidate.id === entry.id
                  ? {
                      ...candidate,
                      status: "failed",
                      lastError,
                      attempts: candidate.attempts + 1,
                    }
                  : candidate,
              ),
            );
          }
        }
      }
    } finally {
      flushing = false;
    }
  };
}
