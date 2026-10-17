"use client";

import {
  type RowIdentity,
  type RowKeys,
  reconcileRowKeys,
} from "domain/row-keys";
import { useState } from "react";

/**
 * React keys that stay put when an optimistic row is confirmed under a new
 * server id (see `reconcileRowKeys`), so the row isn't remounted mid-animation.
 * Look rows up with `keys.get(id)?.key ?? id`.
 */
export function useStableRowKeys(rows: readonly RowIdentity[]): RowKeys {
  const [keys, setKeys] = useState<RowKeys>(() =>
    reconcileRowKeys(new Map(), rows),
  );
  const next = reconcileRowKeys(keys, rows);
  // Adjusting state during render: React re-renders before committing, and the
  // identity check stops once the keys settle.
  if (next !== keys) {
    setKeys(next);
  }
  return next;
}
