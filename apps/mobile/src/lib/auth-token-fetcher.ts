import type { AuthTokenFetcher } from "convex/react";

const MAX_RETRY_DELAY_MS = 30_000;
// Convex Auth resolves null tokens for a rejected refresh token, so a thrown
// non-network error is usually transient (e.g. a 5xx during a deploy).
const MAX_SERVER_ERROR_ATTEMPTS = 3;

/**
 * Network failures as thrown by expo/fetch (`fetch failed: <native cause>`,
 * e.g. an UnknownHostException while offline) and by browser/RN fetch on web.
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.startsWith("fetch failed") ||
    (error instanceof TypeError &&
      (error.message === "Failed to fetch" ||
        error.message === "Network request failed"))
  );
}

export function retryDelayMs(attempt: number): number {
  return Math.min(1_000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

type Options = {
  onError: (error: unknown) => void;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Convex calls the token fetcher from timers with `void`, so a rejection
 * surfaces as an unhandled promise rejection and leaves the auth state stuck.
 * Offline, retry until the network returns: resolving `null` would sign the
 * user out of a session that is still valid. Other failures get a few retries,
 * then are reported and resolve `null`, the fetcher contract for "no token".
 */
export function withTokenFetchRecovery(
  fetchToken: AuthTokenFetcher,
  { onError, sleep = defaultSleep }: Options,
): AuthTokenFetcher {
  return async (args) => {
    let serverErrorAttempts = 0;
    for (let attempt = 0; ; attempt++) {
      try {
        return await fetchToken(args);
      } catch (error) {
        if (!isNetworkError(error)) {
          serverErrorAttempts++;
          if (serverErrorAttempts >= MAX_SERVER_ERROR_ATTEMPTS) {
            onError(error);
            return null;
          }
        }
        await sleep(retryDelayMs(attempt));
      }
    }
  };
}
