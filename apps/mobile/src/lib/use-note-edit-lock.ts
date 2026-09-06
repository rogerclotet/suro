import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";

type Lease = NonNullable<FunctionReturnType<typeof api.noteEditLocks.acquire>>;
type LockState =
  | { kind: "loading" | "blocked" | "error" }
  | { kind: "editing"; lease: Lease; valid: boolean };

/** Each mounted editor owns a distinct lease, including tabs of the same user. */
export function useNoteEditLock(noteId: Id<"notes">) {
  const acquire = useMutation(api.noteEditLocks.acquire);
  const renew = useMutation(api.noteEditLocks.renew);
  const release = useMutation(api.noteEditLocks.release);
  const previousCleanup = useRef<Promise<void>>(Promise.resolve());
  const [state, setState] = useState<LockState>({ kind: "loading" });

  useEffect(() => {
    let disposed = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;

    function markInvalid() {
      if (!disposed)
        setState((current) =>
          current.kind === "editing" ? { ...current, valid: false } : current,
        );
    }
    function armExpiry(expiresAt: number) {
      clearTimeout(expiry);
      expiry = setTimeout(markInvalid, Math.max(0, expiresAt - Date.now()));
    }
    setState({ kind: "loading" });
    // Wait for the previous effect to release its lease before reacquiring,
    // including React Strict Mode's setup/cleanup/setup cycle.
    const acquisition = previousCleanup.current.then(() =>
      disposed ? null : acquire({ noteId }),
    );
    void acquisition
      .then((result) => {
        if (disposed) return;
        if (!result) {
          setState({ kind: "blocked" });
          return;
        }
        setState({ kind: "editing", lease: result, valid: true });
        armExpiry(result.expiresAt);
        heartbeat = setInterval(() => {
          void renew({ lockId: result.lockId })
            .then((expiresAt) => {
              if (disposed) return;
              if (expiresAt === null) {
                clearInterval(heartbeat);
                markInvalid();
                return;
              }
              armExpiry(expiresAt);
              setState((current) =>
                current.kind === "editing"
                  ? { ...current, valid: true }
                  : current,
              );
            })
            .catch(markInvalid);
        }, 15_000);
      })
      .catch(() => {
        if (!disposed) setState({ kind: "error" });
      });

    return () => {
      disposed = true;
      clearInterval(heartbeat);
      clearTimeout(expiry);
      // Editor cleanup first enqueues its final autosave. Convex executes client
      // mutations in order, so releasing cannot overtake that pending save.
      previousCleanup.current = Promise.resolve()
        .then(async () => {
          const lease = await acquisition;
          if (lease) await release({ lockId: lease.lockId });
        })
        .catch(() => {
          // Expiry releases the lock if navigation happens while disconnected.
        });
    };
  }, [noteId, acquire, renew, release]);

  return state;
}
