import { useConvexAuth as useStoredAuth } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

type AuthGate = { isLoading: boolean; isAuthenticated: boolean };

/**
 * Auth state for routing and query gates that also resolves on an offline cold
 * start. Use this anywhere you'd otherwise gate on `convex/react`'s
 * `useConvexAuth` to decide "show the app vs. redirect to /login" or "run the
 * query vs. skip".
 *
 * `convex/react`'s `useConvexAuth` only clears `isLoading` once the backend
 * confirms the token over the websocket. With no network that confirmation
 * never arrives, so a launched-from-cold offline app would hang on the loading
 * spinner forever and never reach the MMKV-cached screens. We fall back to the
 * persisted JWT — `@convex-dev/auth` reads it from secure storage with no
 * network call — whenever the backend hasn't confirmed yet, so cached screens
 * render immediately. The moment the websocket connects, the backend-confirmed
 * state takes over and a revoked or expired session still bounces to /login.
 */
export function useAuthGate(): AuthGate {
  const backend = useConvexAuth();
  const stored = useStoredAuth();

  // Backend-confirmed auth is authoritative once known (covers the online case
  // and a revoked token that was previously confirmed).
  if (!backend.isLoading) {
    return { isLoading: false, isAuthenticated: backend.isAuthenticated };
  }
  // Backend unknown (offline, or websocket still connecting): trust the stored
  // token. `stored.isLoading` is just the brief secure-store read on launch.
  if (stored.isLoading) {
    return { isLoading: true, isAuthenticated: false };
  }
  return { isLoading: false, isAuthenticated: stored.isAuthenticated };
}
