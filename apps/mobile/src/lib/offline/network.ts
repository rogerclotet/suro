import { useConvexConnectionState } from "convex/react";
import { convex } from "@/lib/convex";

/**
 * Online/offline signal, sourced from Convex's own websocket connection state —
 * the signal that actually governs whether reads heal and the outbox can flush.
 * (A faster airplane-mode hint via expo-network could augment this later; the
 * authoritative gate is the websocket being connected.)
 */
export function isOnlineNow(): boolean {
  return convex.connectionState().isWebSocketConnected;
}

export function subscribeOnline(
  callback: (online: boolean) => void,
): () => void {
  return convex.subscribeToConnectionState((state) => {
    callback(state.isWebSocketConnected);
  });
}

export function useIsOnline(): boolean {
  return useConvexConnectionState().isWebSocketConnected;
}
