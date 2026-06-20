/**
 * Stable cache keys for persisted Convex query results.
 *
 * A query is identified by its function name (e.g. "lists:get") plus its args.
 * Two arg objects that differ only in key order must map to the same key, so we
 * canonicalize by recursively sorting object keys before serializing. This is
 * pure (no react-native imports) so it stays unit-testable in plain Node.
 */

/** Recursively sort object keys so serialization is order-independent. */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * The MMKV key under which a query result is cached. `args` is the value passed
 * to `useQuery` (an object, or `undefined` for no-arg queries; `"skip"` never
 * reaches here). `undefined` and `{}` normalize to the same key, mirroring how
 * Convex treats a no-arg call and an empty-args call as one query. Prefixed with
 * `q:` to namespace it from the outbox keys.
 */
export function cacheKey(functionName: string, args: unknown): string {
  return `q:${functionName}:${JSON.stringify(canonicalize(args ?? {}))}`;
}
