/**
 * Detects transient connectivity failures — failed fetches, dropped
 * connections, and the offline sync layer's `NetworkError` — as opposed to
 * genuine application bugs.
 *
 * Browsers phrase fetch failures differently ("Failed to fetch" in Chromium,
 * "Load failed" / "The network connection was lost" in WebKit, "NetworkError
 * when attempting to fetch resource" in Firefox, a bare "network error" on some
 * flaky mobile connections), so we match on the substrings they have in common.
 *
 * Used to keep flaky-network blips from being surfaced as fatal errors or
 * reported to error tracking, since the offline layer recovers from them.
 */
export function isNetworkError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { isNetworkError?: boolean }).isNetworkError === true
  ) {
    return true;
  }

  if (error instanceof Error) {
    if (error.name === "NetworkError") return true;

    const message = error.message.toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("load failed") ||
      message.includes("connection")
    );
  }

  return false;
}
