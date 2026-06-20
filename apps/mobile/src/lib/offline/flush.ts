import { convex } from "@/lib/convex";
import { isOnlineNow } from "./network";
import { compact, hasUnresolvedTemp, remapArgs } from "./outbox-logic";
import { outbox } from "./outbox-store";
import { MUTATION_REGISTRY } from "./registry";

/**
 * Drains the offline write queue on reconnect, in order, exactly once per entry.
 *
 * A rejected mutation means the server actually ran the handler and it threw —
 * transient network drops don't reject (the Convex client retries them), so a
 * rejection is treated as permanent. "Not found" is treated as success, which
 * makes replaying a delete whose target is already gone idempotent. Creates'
 * server ids are recorded immediately so dependent ops remap before they run.
 */
let flushing = false;

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNotFound(error: unknown): boolean {
  return /not found/i.test(message(error));
}

function dropEntry(id: string): void {
  outbox.replaceEntries(outbox.getEntries().filter((entry) => entry.id !== id));
}

function markFailed(id: string, reason: string): void {
  outbox.replaceEntries(
    outbox.getEntries().map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status: "failed" as const,
            lastError: reason,
            attempts: entry.attempts + 1,
          }
        : entry,
    ),
  );
}

export async function flush(): Promise<void> {
  if (flushing || !isOnlineNow()) {
    return;
  }
  flushing = true;
  try {
    // Collapse create→delete chains that never need to reach the server.
    const compacted = compact(outbox.getEntries());
    if (compacted.length !== outbox.getEntries().length) {
      outbox.replaceEntries(compacted);
    }

    for (const entry of compacted) {
      if (!isOnlineNow()) {
        break; // connection dropped mid-flush; resume on the next reconnect
      }
      if (entry.status === "failed") {
        continue; // permanent failures are kept for visibility, not retried
      }
      const ref = MUTATION_REGISTRY[entry.functionName];
      if (ref === undefined) {
        markFailed(entry.id, `unknown mutation ${entry.functionName}`);
        continue;
      }
      const remapped = remapArgs(entry.args, outbox.getIdmap());
      if (hasUnresolvedTemp(remapped)) {
        // A parent create earlier in the queue failed or was orphaned.
        markFailed(entry.id, "unresolved dependency");
        continue;
      }
      try {
        const result: unknown = await convex.mutation(ref, remapped);
        const tempId = entry.tempIds[0];
        if (tempId !== undefined && typeof result === "string") {
          outbox.resolveTempId(tempId, result);
        }
        dropEntry(entry.id);
      } catch (error) {
        if (isNotFound(error)) {
          dropEntry(entry.id);
        } else {
          markFailed(entry.id, message(error));
        }
      }
    }
  } finally {
    flushing = false;
  }
}
