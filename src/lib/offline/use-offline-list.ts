"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { List, ListItem } from "@/app/_data/list";
import { db, type OfflineList, type OfflineListItem } from "./db";
import { toTimestamp } from "./to-timestamp";

export interface OfflineListResult {
  list: List | undefined;
  isLoading: boolean;
  isSyncing: boolean;
  hasOfflineChanges: boolean;
  hasPendingItems: boolean;
  hasConflicts: boolean;
  syncFromServer: () => Promise<void>;
  reloadOfflineData: () => Promise<void>;
}

async function checkActualConnectivity(): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function useOfflineList(
  initialList: List | undefined,
  listId: string,
): OfflineListResult {
  const router = useRouter();

  // Start with null (unknown), not assumed online
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineList, setOfflineList] = useState<OfflineList | undefined>(
    undefined,
  );
  const [offlineItems, setOfflineItems] = useState<OfflineListItem[]>([]);
  // Tracks which listIds have been seeded into IndexedDB this session.
  // A Set (not a boolean) so it persists across list switches without requiring remount.
  const seededListsRef = useRef(new Set<string>());

  // Track online status with actual connectivity check
  useEffect(() => {
    // Initial check
    checkActualConnectivity().then(setIsOnline);

    const handleOnline = async () => {
      const actuallyOnline = await checkActualConnectivity();
      setIsOnline(actuallyOnline);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load offline data
  const loadOfflineData = useCallback(async () => {
    try {
      const list = await db.lists.get(listId);
      const items = await db.listItems.where("listId").equals(listId).toArray();

      // Use functional updates to avoid triggering re-renders when data hasn't changed
      setOfflineList((prev) => {
        if (!prev && !list) return prev;
        if (!prev || !list) return list;
        if (prev._lastModified === list._lastModified) return prev;
        return list;
      });

      setOfflineItems((prev) => {
        if (prev.length !== items.length) return items;
        const prevById = new Map(prev.map((i) => [i.id, i._lastModified]));
        if (items.every((i) => prevById.get(i.id) === i._lastModified))
          return prev;
        return items;
      });
    } catch (error) {
      console.error("[use-offline-list] IndexedDB load failed:", error);
    }
  }, [listId]);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOfflineData();
  }, [loadOfflineData]);

  // Background sync when online
  const syncFromServer = useCallback(async () => {
    if (!isOnline || !listId) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`/api/offline/lists/${listId}`);
      if (!response.ok) return;

      const serverList = await response.json();
      await updateLocalFromServer(serverList);
      await loadOfflineData();
    } catch (error) {
      console.warn("Failed to sync list from server:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, listId, loadOfflineData]);

  // Seed IndexedDB with initial server data the first time each list is opened.
  // seededListsRef persists across list switches so revisiting a list doesn't re-seed.
  useEffect(() => {
    if (initialList && !seededListsRef.current.has(listId)) {
      seededListsRef.current.add(listId); // mark before async to prevent double-seed
      seedFromServer(initialList).then(() => {
        loadOfflineData();
        if (isOnline) syncFromServer();
      });
    }
  }, [initialList, listId, loadOfflineData, isOnline, syncFromServer]);

  // Auto-sync on coming online
  useEffect(() => {
    if (isOnline && seededListsRef.current.has(listId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      syncFromServer();
    }
  }, [isOnline, listId, syncFromServer]);

  // Refresh data when sync completes (items may have new IDs)
  useEffect(() => {
    const handleSyncCompleted = () => {
      loadOfflineData();
      // Also fetch latest from server to get synced items
      syncFromServer();
      // Refresh the page to get fresh server component data
      router.refresh();
    };

    window.addEventListener("sync-completed", handleSyncCompleted);
    return () =>
      window.removeEventListener("sync-completed", handleSyncCompleted);
  }, [loadOfflineData, syncFromServer, router]);

  // Poll for IndexedDB changes when offline (since we don't have live queries)
  useEffect(() => {
    if (isOnline) return;

    const interval = setInterval(() => {
      loadOfflineData();
    }, 500); // Check every 500ms when offline

    return () => clearInterval(interval);
  }, [isOnline, loadOfflineData]);

  // Check for pending/conflict items
  const hasPendingItems = offlineItems.some(
    (item) => item._syncStatus === "pending",
  );

  const hasConflicts = offlineItems.some(
    (item) => item._syncStatus === "conflict",
  );

  // Merge offline data with initial list structure.
  // useMemo prevents new object references on every render — stable refs are required for useAutoAnimate.
  // Intentionally excludes isOnline — merge is based on _syncStatus, not connectivity,
  // so connectivity transitions don't cause re-renders that flash stale data.
  // listId is included to discard stale IndexedDB state from a previously-viewed list
  // during the async window between a list switch and the next loadOfflineData call.
  const mergedList = useMemo(
    () => getMergedList(initialList, offlineList, offlineItems, listId),
    [initialList, offlineList, offlineItems, listId],
  );

  return {
    list: mergedList,
    isLoading: offlineList === undefined && initialList === undefined,
    isSyncing,
    hasOfflineChanges: hasPendingItems,
    hasPendingItems,
    hasConflicts,
    reloadOfflineData: loadOfflineData,
    syncFromServer,
  };
}

function getMergedList(
  initialList: List | undefined,
  offlineList: OfflineList | undefined,
  offlineItems: OfflineListItem[],
  listId: string,
): List | undefined {
  // Discard stale IndexedDB data from a previously-viewed list.
  // This can happen briefly during a list switch before loadOfflineData re-runs.
  const activeOfflineList =
    offlineList?.id === listId ? offlineList : undefined;
  const activeOfflineItems = offlineItems.filter((i) => i.listId === listId);

  // Need at least one data source
  if (!initialList && !activeOfflineList) {
    return undefined;
  }

  // If IndexedDB is fully synced with no local changes, return the server data
  // unchanged. This preserves the object reference and prevents unnecessary
  // re-renders and sort instability when IndexedDB loads after the first render.
  const hasPendingOrConflict = activeOfflineItems.some(
    (i) => i._syncStatus === "pending" || i._syncStatus === "conflict",
  );
  const listHasPending = activeOfflineList?._syncStatus === "pending";

  if (initialList && !listHasPending && !hasPendingOrConflict) {
    return initialList;
  }

  // We have local changes — merge them on top of server data
  if (activeOfflineList) {
    const baseList = initialList ?? createListFromOffline(activeOfflineList);
    const mergedItems = mergeItems(baseList.items, activeOfflineItems);

    return {
      ...baseList,
      // Only override list metadata when the list itself has pending local changes
      ...(listHasPending && {
        name: activeOfflineList.name,
        description: activeOfflineList.description,
        favorite: activeOfflineList.favorite,
      }),
      items: mergedItems,
    };
  }

  // No IndexedDB data yet — use server data with any pending items overlaid
  if (initialList) {
    if (activeOfflineItems.length === 0) {
      return initialList;
    }
    const mergedItems = mergeItems(initialList.items, activeOfflineItems);
    return {
      ...initialList,
      items: mergedItems,
    };
  }

  return undefined;
}

function mergeItems(
  serverItems: ListItem[],
  offlineItems: OfflineListItem[],
): ListItem[] {
  const offlineMap = new Map(offlineItems.map((item) => [item.id, item]));
  const merged: ListItem[] = [];

  // Process server items, overlay with local changes that haven't synced yet
  for (const serverItem of serverItems) {
    const offlineItem = offlineMap.get(serverItem.id);

    if (offlineItem) {
      // Pending local deletion — hide until sync confirms it server-side
      if (offlineItem._deleted && offlineItem._syncStatus === "pending") {
        offlineMap.delete(serverItem.id);
        continue;
      }

      // Pending or conflicted local changes take precedence over server data
      if (
        offlineItem._syncStatus === "pending" ||
        offlineItem._syncStatus === "conflict"
      ) {
        merged.push({
          ...serverItem,
          name: offlineItem.name,
          details: offlineItem.details,
          completed: offlineItem.completed,
          categoryId: offlineItem.categoryId,
          category:
            offlineItem.categoryId === serverItem.categoryId
              ? serverItem.category
              : offlineItem.categoryId
                ? ({
                    id: offlineItem.categoryId,
                    name: offlineItem.categoryName ?? "",
                  } as ListItem["category"])
                : null,
          _isPending: offlineItem._syncStatus === "pending",
          _isConflict: offlineItem._syncStatus === "conflict",
        } as ListItem);
      } else {
        // Synced — server is the source of truth
        merged.push(serverItem);
      }

      offlineMap.delete(serverItem.id);
    } else {
      merged.push(serverItem);
    }
  }

  // Add locally-created items that haven't synced yet.
  // Skipping synced local-only items avoids showing stale `local-` entries
  // that weren't cleaned up yet by seedFromServer.
  for (const offlineItem of offlineMap.values()) {
    if (offlineItem._syncStatus !== "pending") continue;
    if (offlineItem._deleted) continue;

    merged.push({
      id: offlineItem.id,
      name: offlineItem.name,
      details: offlineItem.details,
      completed: offlineItem.completed,
      listId: offlineItem.listId,
      categoryId: offlineItem.categoryId,
      category: offlineItem.categoryId
        ? ({
            id: offlineItem.categoryId,
            name: offlineItem.categoryName ?? "",
          } as ListItem["category"])
        : null,
      createdAt: new Date(offlineItem.createdAt),
      createdBy: offlineItem.createdBy,
      updatedAt: offlineItem.updatedAt ? new Date(offlineItem.updatedAt) : null,
      updatedBy: offlineItem.updatedBy,
      _isPending: true,
      _isConflict: false,
    } as ListItem);
  }

  // Sort: uncompleted first, then by name, then by id as stable tiebreaker
  return merged.sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    const nameCompare = a.name.localeCompare(b.name);
    return nameCompare !== 0 ? nameCompare : a.id.localeCompare(b.id);
  });
}

function createListFromOffline(offlineList: OfflineList): List {
  return {
    id: offlineList.id,
    name: offlineList.name,
    description: offlineList.description,
    projectId: offlineList.projectId,
    eventId: offlineList.eventId,
    favorite: offlineList.favorite,
    createdAt: new Date(offlineList.createdAt),
    createdBy: offlineList.createdBy,
    updatedAt: offlineList.updatedAt ? new Date(offlineList.updatedAt) : null,
    updatedBy: offlineList.updatedBy,
    items: [],
    project: {
      id: offlineList.projectId,
      users: [],
    } as unknown as List["project"],
    event: null,
  };
}

// Returns the set of entity IDs that have a genuine pending queue entry.
// Items marked "pending" in IDB but absent from the queue are orphans —
// their queue entry was removed (sync success or max retries) without the
// IDB status being updated. Orphans must NOT be treated as local changes.
async function getQueuedEntityIds(): Promise<Set<string>> {
  const queued = await db.syncQueue.toArray();
  return new Set(queued.map((q) => q.entityId));
}

async function seedFromServer(serverList: List): Promise<void> {
  const queuedIds = await getQueuedEntityIds();

  const existing = await db.lists.get(serverList.id);
  // Only preserve the list's local changes if there's actually a queue entry for it
  if (
    existing &&
    existing._syncStatus === "pending" &&
    queuedIds.has(serverList.id)
  ) {
    return;
  }

  await db.lists.put({
    id: serverList.id,
    name: serverList.name,
    description: serverList.description,
    projectId: serverList.projectId,
    eventId: serverList.eventId,
    favorite: serverList.favorite,
    createdAt: toTimestamp(serverList.createdAt),
    createdBy: serverList.createdBy,
    updatedAt: toTimestamp(serverList.updatedAt),
    updatedBy: serverList.updatedBy,
    _syncStatus: "synced",
    _localVersion: 1,
    _serverVersion: 1,
    _lastModified: Date.now(),
  });

  // Clean up stale local-only items before seeding
  const localItems = await db.listItems
    .where("listId")
    .equals(serverList.id)
    .toArray();
  for (const localItem of localItems) {
    if (localItem.id.startsWith("local-") && !queuedIds.has(localItem.id)) {
      await db.listItems.delete(localItem.id);
    }
  }

  // Seed items — only skip items with a genuine pending queue entry
  for (const item of serverList.items) {
    const existingItem = await db.listItems.get(item.id);
    if (
      existingItem &&
      existingItem._syncStatus === "pending" &&
      queuedIds.has(item.id)
    ) {
      continue;
    }

    await db.listItems.put({
      id: item.id,
      name: item.name,
      details: item.details,
      completed: item.completed ?? false,
      listId: item.listId,
      categoryId: item.categoryId,
      categoryName: item.category?.name ?? null,
      createdAt: toTimestamp(item.createdAt),
      createdBy: item.createdBy,
      updatedAt: toTimestamp(item.updatedAt),
      updatedBy: item.updatedBy,
      _syncStatus: "synced",
      _localVersion: 1,
      _serverVersion: 1,
      _lastModified: Date.now(),
    });
  }
}

async function updateLocalFromServer(serverList: List): Promise<void> {
  const queuedIds = await getQueuedEntityIds();

  const existingList = await db.lists.get(serverList.id);
  const listIsGenuinelyPending =
    existingList?._syncStatus === "pending" && queuedIds.has(serverList.id);

  if (!listIsGenuinelyPending) {
    await db.lists.put({
      id: serverList.id,
      name: serverList.name,
      description: serverList.description,
      projectId: serverList.projectId,
      eventId: serverList.eventId,
      favorite: serverList.favorite,
      createdAt: toTimestamp(serverList.createdAt),
      createdBy: serverList.createdBy,
      updatedAt: toTimestamp(serverList.updatedAt),
      updatedBy: serverList.updatedBy,
      _syncStatus: "synced",
      _localVersion: 1,
      _serverVersion: 1,
      _lastModified: Date.now(),
    });
  }

  // Update items — only skip items with a genuine pending queue entry
  for (const item of serverList.items) {
    const existingItem = await db.listItems.get(item.id);
    if (
      existingItem &&
      existingItem._syncStatus === "pending" &&
      queuedIds.has(item.id)
    ) {
      continue;
    }

    await db.listItems.put({
      id: item.id,
      name: item.name,
      details: item.details,
      completed: item.completed ?? false,
      listId: item.listId,
      categoryId: item.categoryId,
      categoryName: item.category?.name ?? null,
      createdAt: toTimestamp(item.createdAt),
      createdBy: item.createdBy,
      updatedAt: toTimestamp(item.updatedAt),
      updatedBy: item.updatedBy,
      _syncStatus: "synced",
      _localVersion: 1,
      _serverVersion: 1,
      _lastModified: Date.now(),
    });
  }

  // Remove items that no longer exist on server
  const serverItemIds = new Set(serverList.items.map((i) => i.id));
  const localItems = await db.listItems
    .where("listId")
    .equals(serverList.id)
    .toArray();

  for (const localItem of localItems) {
    if (!serverItemIds.has(localItem.id)) {
      if (localItem._syncStatus === "synced") {
        await db.listItems.delete(localItem.id);
      }
      if (localItem.id.startsWith("local-") && !queuedIds.has(localItem.id)) {
        await db.listItems.delete(localItem.id);
      }
    }
  }
}
