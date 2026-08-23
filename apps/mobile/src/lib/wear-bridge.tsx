import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useLocale } from "@/i18n";
import { getLastProjectId } from "@/lib/last-project";
import {
  addWearListener,
  clearAuth,
  isWatchConnected,
  isWearBridgeAvailable,
  pushAuthTicket,
  pushContext,
} from "@/modules/suro-wear";

/**
 * Keeps the Wear OS app supplied with a session.
 *
 * The watch has no way to sign in by itself, so the phone mints a one-time
 * Convex Auth ticket and writes it to the Data Layer, where it reaches the watch
 * even if the watch app is closed. The watch redeems it for a session of its
 * own — not a copy of this device's, because Convex Auth refresh tokens are
 * single-use and sharing one would sign the phone out (see
 * `packages/backend/convex/WatchPairing.ts`).
 *
 * Pushing happens on every foreground while a watch is connected and hasn't
 * acked. That's cheap (one mutation), and it means the worst case after a
 * sign-out is "open Suro on your phone once", which is exactly what the watch's
 * setup screen tells the user to do.
 */

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

type WearStatus = {
  /** A watch running the companion app is currently reachable. */
  connected: boolean;
  /** The watch has confirmed it holds a session. */
  paired: boolean;
};

export function useWearBridge(): WearStatus & { reconnect: () => void } {
  const { isAuthenticated } = useConvexAuth();
  const locale = useLocale();
  const createTicket = useMutation(api.watchPairings.createTicket);

  const [connected, setConnected] = useState(false);
  const [paired, setPaired] = useState(false);
  // Held in a ref as well as state: the AppState listener closes over it, and we
  // don't want a re-subscribe every time the ack flips.
  const ackedRef = useRef(false);

  const push = useCallback(
    async (force: boolean) => {
      if (!isWearBridgeAvailable || !isAuthenticated) {
        return;
      }
      const reachable = await isWatchConnected();
      setConnected(reachable);
      if (!reachable || (ackedRef.current && !force)) {
        return;
      }
      try {
        const { secret } = await createTicket({});
        await pushAuthTicket(secret, CONVEX_URL);
        await pushContext(await getLastProjectId(), locale);
      } catch {
        // A failed mint or push is not worth surfacing: the watch shows its own
        // "open Suro on your phone" state, and the next foreground retries.
      }
    },
    [createTicket, isAuthenticated, locale],
  );

  // The watch confirms redemption, so we stop re-pushing and drop the spent
  // ticket rather than leaving it in the Data Layer to be replayed.
  useEffect(() => {
    return addWearListener("onAuthAck", () => {
      ackedRef.current = true;
      setPaired(true);
      void clearAuth();
    });
  }, []);

  // The watch is on its setup screen right now and wants a ticket immediately,
  // rather than waiting for the next time the phone app is opened.
  useEffect(() => {
    return addWearListener("onTicketRequest", () => {
      ackedRef.current = false;
      setPaired(false);
      void push(true);
    });
  }, [push]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Signing out invalidates the session the watch was paired against; drop
      // the pending ticket so it can't be redeemed by whoever signs in next.
      ackedRef.current = false;
      setPaired(false);
      void clearAuth();
      return;
    }
    void push(false);
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") {
          void push(false);
        }
      },
    );
    return () => subscription.remove();
  }, [isAuthenticated, push]);

  const reconnect = useCallback(() => {
    ackedRef.current = false;
    setPaired(false);
    void push(true);
  }, [push]);

  return { connected, paired, reconnect };
}
