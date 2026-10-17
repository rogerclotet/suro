/**
 * Render keys for reactive rows whose optimistic placeholders are replaced by
 * server documents with different ids.
 *
 * Convex drops an optimistic update and delivers the stored document in the
 * same query update, so a row keyed by id unmounts and remounts at the moment
 * its write is confirmed, replaying its exit and enter animations. Placeholder
 * ids can also change whenever Convex replays pending updates on top of fresh
 * server data. A row that appears in the same update in which a row with the
 * same signature disappears inherits that row's key, so the UI keeps the
 * mounted row and only patches its content.
 */

export type RowIdentity = {
  id: string;
  /** Rows that would render identically share a signature. */
  signature: string;
};

export type RowKeys = ReadonlyMap<string, { key: string; signature: string }>;

/**
 * Carry keys over from `previous` to `rows`. Returns `previous` itself when
 * nothing changed, so callers can store the result in state without looping.
 */
export function reconcileRowKeys(
  previous: RowKeys,
  rows: readonly RowIdentity[],
): RowKeys {
  const present = new Set(rows.map((row) => row.id));
  const vanishedKeys = new Map<string, string[]>();
  for (const [id, entry] of previous) {
    if (present.has(id)) continue;
    const keys = vanishedKeys.get(entry.signature) ?? [];
    keys.push(entry.key);
    vanishedKeys.set(entry.signature, keys);
  }

  // Kept and inherited keys are disjoint because `previous` had unique keys.
  // A fresh row normally uses its own id; the suffix only guards against an
  // id that matches a key some other row inherited.
  const used = new Set<string>();
  for (const row of rows) {
    const kept = previous.get(row.id);
    if (kept) used.add(kept.key);
  }
  const freshKey = (id: string) => {
    let key = id;
    for (let n = 1; used.has(key); n++) key = `${id}~${n}`;
    return key;
  };

  const next = new Map<string, { key: string; signature: string }>();
  let changed = previous.size !== rows.length;
  for (const row of rows) {
    const kept = previous.get(row.id);
    let key = kept?.key ?? vanishedKeys.get(row.signature)?.shift();
    if (key === undefined) {
      key = freshKey(row.id);
    }
    used.add(key);
    if (kept?.key !== key || kept.signature !== row.signature) changed = true;
    next.set(row.id, { key, signature: row.signature });
  }
  return changed ? next : previous;
}

/** Signature for checklist rows: same name in the same category. */
export function listItemSignature(item: {
  name: string;
  category?: string | null;
}): string {
  return `${item.category?.trim() ?? ""}\n${item.name.trim()}`;
}
