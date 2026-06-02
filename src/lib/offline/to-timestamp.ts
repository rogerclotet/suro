// Date fields cross the client boundary two different ways: React Server
// Component props arrive as real Date objects, while anything fetched and
// JSON-parsed (TanStack Query refetches, /api responses) arrives as ISO
// strings. Code that seeds IndexedDB must tolerate both, so normalise to a
// numeric timestamp here instead of assuming `.getTime()` exists.
export function toTimestamp(
  value: Date | string | number | null | undefined,
): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  return Date.now();
}
