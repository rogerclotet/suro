"use client";

import { useEffect, useState } from "react";
import { db } from "./db";

export interface SyncStatus {
  pendingCount: number;
  conflictCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
}

const defaultStatus: SyncStatus = {
  pendingCount: 0,
  conflictCount: 0,
  isSyncing: false,
  lastSyncTime: null,
};

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(defaultStatus);

  useEffect(() => {
    let cancelled = false;

    const updateStatus = async () => {
      try {
        const pendingCount = await db.syncQueue.count();
        const listsConflicts = await db.lists
          .where("_syncStatus")
          .equals("conflict")
          .count();
        const itemsConflicts = await db.listItems
          .where("_syncStatus")
          .equals("conflict")
          .count();
        const metadata = await db.syncMetadata.get("global");

        if (!cancelled) {
          setStatus({
            pendingCount,
            conflictCount: listsConflicts + itemsConflicts,
            isSyncing: metadata?.syncInProgress ?? false,
            lastSyncTime: metadata?.lastSyncTimestamp ?? null,
          });
        }
      } catch {
        // IndexedDB not available
      }
    };

    updateStatus();

    // Poll every 2 seconds for changes
    const interval = setInterval(updateStatus, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}
