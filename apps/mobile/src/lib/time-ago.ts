const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative time: "just now", "5m ago", "3h ago", "2d ago", or a date. */
export function timeAgo(epochMs: number, now: number = Date.now()): string {
  const diff = now - epochMs;
  if (diff < MINUTE) {
    return "just now";
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)}m ago`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}h ago`;
  }
  if (diff < 7 * DAY) {
    return `${Math.floor(diff / DAY)}d ago`;
  }
  return new Date(epochMs).toLocaleDateString();
}
