import {
  DELETE_FUNCTIONS,
  type IdMap,
  isTempId,
  type OutboxEntry,
} from "./types";

/** Temp-id values that appear at the top level of an entry's args. */
function tempArgValues(args: Record<string, unknown>): string[] {
  return Object.values(args).filter(isTempId);
}

/**
 * Collapse create→…→delete chains that never need to touch the server.
 *
 * If an entity is created offline (a create entry owns its temp id) and then
 * deleted while still offline (a delete-type entry targets that temp id), the
 * whole chain — the create, the delete, and any updates or child ops that
 * reference the temp id — is dropped. This both avoids round-trips and sidesteps
 * the "create then delete a thing the server never saw" race. Pure.
 */
export function compact(entries: OutboxEntry[]): OutboxEntry[] {
  const created = new Set(entries.flatMap((entry) => entry.tempIds));
  const cancelled = new Set<string>();
  for (const entry of entries) {
    if (!DELETE_FUNCTIONS.has(entry.functionName)) {
      continue;
    }
    for (const value of tempArgValues(entry.args)) {
      if (created.has(value)) {
        cancelled.add(value);
      }
    }
  }
  if (cancelled.size === 0) {
    return entries;
  }
  return entries.filter((entry) => {
    if (entry.tempIds.some((id) => cancelled.has(id))) {
      return false;
    }
    if (entry.dependsOn.some((id) => cancelled.has(id))) {
      return false;
    }
    if (tempArgValues(entry.args).some((id) => cancelled.has(id))) {
      return false;
    }
    return true;
  });
}

/**
 * Replace any temp-id arg value with its resolved server id. Mutation args are
 * flat (the only nested field, settlePayments' `payments`, carries real user ids
 * only), so a top-level pass suffices.
 */
export function remapArgs(
  args: Record<string, unknown>,
  idmap: IdMap,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    out[key] = isTempId(value) && idmap[value] ? idmap[value] : value;
  }
  return out;
}

/** True if any arg is still an unresolved temp id (parent not yet created). */
export function hasUnresolvedTemp(args: Record<string, unknown>): boolean {
  return tempArgValues(args).length > 0;
}
