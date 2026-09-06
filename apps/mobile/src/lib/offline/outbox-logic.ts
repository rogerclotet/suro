import { OPERATIONS } from "./operations";
import { type IdMap, isTempId, type OutboxEntry } from "./types";

// Reference fields follow the API's Id/Ids convention; expense transfers use from/to.
// Free text such as a list named "temp-shopping" must never become a dependency.
function isReferenceKey(key: string) {
  return (
    key.endsWith("Id") || key.endsWith("Ids") || key === "from" || key === "to"
  );
}
export function tempIdsIn(value: unknown, reference = false): string[] {
  if (isTempId(value)) return reference ? [value] : [];
  if (Array.isArray(value))
    return value.flatMap((child) => tempIdsIn(child, reference));
  if (value !== null && typeof value === "object")
    return Object.entries(value).flatMap(([key, child]) =>
      tempIdsIn(child, isReferenceKey(key)),
    );
  return [];
}

/** Include all descendants so recovery never leaves orphaned child writes. */
export function dependentEntryIds(
  entries: OutboxEntry[],
  entryId: string,
): Set<string> {
  const removed = new Set([entryId]);
  const temps = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of entries) {
      if (removed.has(entry.id)) {
        for (const id of entry.tempIds) {
          if (!temps.has(id)) {
            temps.add(id);
            changed = true;
          }
        }
      } else if (
        [...entry.dependsOn, ...tempIdsIn(entry.args)].some((id) =>
          temps.has(id),
        )
      ) {
        removed.add(entry.id);
        changed = true;
      }
    }
  }
  return removed;
}

export function compact(entries: OutboxEntry[]): OutboxEntry[] {
  const created = new Map(
    entries.flatMap((entry) =>
      entry.tempIds.map((id) => [id, entry.id] as const),
    ),
  );
  const removed = new Set<string>();
  for (const entry of entries) {
    if (OPERATIONS[entry.functionName].kind !== "delete") continue;
    for (const temp of tempIdsIn(entry.args)) {
      const parent = created.get(temp);
      if (parent) {
        for (const id of dependentEntryIds(entries, parent)) removed.add(id);
      }
    }
  }
  return entries.filter((entry) => !removed.has(entry.id));
}

/** Shape-preserving reference substitution at the storage/API boundary. */
export function remapArgs<Args extends Record<string, unknown>>(
  args: Args,
  idmap: IdMap,
): Args {
  const remap = (value: unknown, reference: boolean): unknown => {
    if (isTempId(value)) return reference ? (idmap[value] ?? value) : value;
    if (Array.isArray(value))
      return value.map((child) => remap(child, reference));
    if (value !== null && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          remap(child, isReferenceKey(key)),
        ]),
      );
    return value;
  };
  // Only ID string values change; object keys, arrays and all other values retain their types.
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [
      key,
      remap(value, isReferenceKey(key)),
    ]),
  ) as Args;
}

/** A mapped Convex ID retains its table brand at this persistence boundary. */
export function resolveOfflineId<Id extends string>(id: Id, idmap: IdMap): Id {
  return (idmap[id] ?? id) as Id;
}
export function hasUnresolvedTemp(args: Record<string, unknown>): boolean {
  return tempIdsIn(args).length > 0;
}
