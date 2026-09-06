import { OPERATIONS } from "./operations";
import { type IdMap, isTempId, type OutboxEntry } from "./types";

/** Dependencies can occur inside arrays as well as top-level arguments. */
export function tempIdsIn(value: unknown): string[] {
  if (isTempId(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(tempIdsIn);
  if (value !== null && typeof value === "object")
    return Object.values(value).flatMap(tempIdsIn);
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

export function remapArgs(
  args: Record<string, unknown>,
  idmap: IdMap,
): Record<string, unknown> {
  const remap = (value: unknown): unknown => {
    if (isTempId(value)) return idmap[value] ?? value;
    if (Array.isArray(value)) return value.map(remap);
    if (value !== null && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, remap(child)]),
      );
    return value;
  };
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, remap(value)]),
  );
}
export function hasUnresolvedTemp(args: Record<string, unknown>): boolean {
  return tempIdsIn(args).length > 0;
}
