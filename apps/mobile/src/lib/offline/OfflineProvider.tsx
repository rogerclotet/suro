import { api } from "backend/convex/_generated/api";
import { type ReactNode, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { flush } from "./flush";
import { isOnlineNow, subscribeOnline } from "./network";
import { outbox } from "./outbox-store";
import { clearQueryCache } from "./storage";
import { useAuthGate } from "./use-auth-gate";
import { usePersistentQuery } from "./use-persistent-query";

/**
 * Drives the offline write queue: flushes it on reconnect, on app foreground,
 * and on mount; stamps the queue's owner and discards it if a different account
 * signs in on the same device; and clears the cached data on sign-out. Renders
 * nothing — it mounts inside `ConvexAuthProvider` so it can read auth + client.
 */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthGate();
  const me = usePersistentQuery(api.users.me, isAuthenticated ? {} : "skip");
  const wasAuthenticated = useRef(false);

  // Stamp the queue's owner; if a different user signs in, discard the previous
  // user's queued writes + cache so nothing leaks across accounts.
  useEffect(() => {
    if (!isAuthenticated || !me) {
      return;
    }
    const owner = outbox.getUserId();
    if (owner !== null && owner !== me._id) {
      outbox.clearOutbox();
      clearQueryCache();
    }
    outbox.setUserId(me._id);
  }, [isAuthenticated, me]);

  // On sign-out, drop cached data so the next account starts clean. The outbox
  // is kept: a same-user re-login flushes it; a different user clears it above.
  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      clearQueryCache();
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  // Flush triggers: reconnect, foreground, and mount (all gated on auth).
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const tryFlush = () => {
      if (isOnlineNow()) {
        void flush();
      }
    };
    tryFlush();
    const unsubscribeNetwork = subscribeOnline((online) => {
      if (online) {
        void flush();
      }
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        tryFlush();
      }
    });
    return () => {
      unsubscribeNetwork();
      appStateSub.remove();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
