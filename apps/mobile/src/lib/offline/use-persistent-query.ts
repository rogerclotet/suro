import { type OptionalRestArgsOrSkip, useQuery } from "convex/react";
import { type FunctionReference, getFunctionName } from "convex/server";
import { useEffect, useRef } from "react";
import { cacheKey } from "./cache-key";
import { cacheGet, cacheSet } from "./storage";

/**
 * Drop-in replacement for Convex's `useQuery` that persists results to disk and
 * serves the last-seen value on an offline cold start. Identical signature and
 * return type, so call sites only change the import — and `withOptimisticUpdate`
 * is untouched, since optimism lives in the Convex store read by the inner
 * `useQuery`; the cache only fills the gap when `useQuery` is `undefined`.
 */
export function usePersistentQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
): Query["_returnType"] | undefined {
  const live = useQuery(query, ...args);
  const queryArgs = args[0];
  const skip = queryArgs === "skip";
  const key = skip ? null : cacheKey(getFunctionName(query), queryArgs);

  // Write-through: persist the latest server value (incl. `null` = "deleted").
  useEffect(() => {
    if (key !== null && live !== undefined) {
      cacheSet(key, live);
    }
  }, [key, live]);

  // Read the cached fallback once per key so its reference stays stable across
  // renders during the offline window (prevents downstream re-render churn).
  const cached = useRef<{ key: string; value: unknown } | null>(null);
  if (key !== null && (cached.current === null || cached.current.key !== key)) {
    cached.current = { key, value: cacheGet(key) };
  }

  if (live !== undefined) {
    return live;
  }
  if (skip) {
    return undefined;
  }
  return cached.current?.value as Query["_returnType"] | undefined;
}
