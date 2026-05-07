import { toast } from "sonner";
import { ConflictResolver } from "./conflict-resolver";
import { db, type EntityType, type SyncQueueItem } from "./db";

const MAX_RETRY_COUNT = 3;

async function isActuallyOnline(): Promise<boolean> {
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

class SyncManagerClass {
  private isSyncing = false;
  private onlineListener: (() => void) | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") {
      return;
    }

    this.initialized = true;

    this.onlineListener = () => {
      // Don't trust navigator.onLine alone, processQueue will verify
      this.processQueue();
    };
    window.addEventListener("online", this.onlineListener);

    this.messageListener = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_REQUESTED") {
        this.processQueue();
      }
    };
    navigator.serviceWorker?.addEventListener("message", this.messageListener);

    // Check actual connectivity before trying to sync on init
    isActuallyOnline().then((online) => {
      if (online) {
        this.processQueue();
      }
    });
  }

  async enqueue(
    item: Omit<SyncQueueItem, "id" | "retryCount" | "timestamp">,
  ): Promise<void> {
    try {
      await db.syncQueue.add({
        ...item,
        timestamp: Date.now(),
        retryCount: 0,
      });
    } catch (error) {
      console.error("[sync-manager] failed to enqueue:", error);
      throw error;
    }

    if (navigator.onLine) {
      this.processQueue();
    } else {
      this.registerBackgroundSync();
    }
  }

  private async registerBackgroundSync() {
    if (
      "serviceWorker" in navigator &&
      "sync" in (window.ServiceWorkerRegistration?.prototype ?? {})
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (
          registration as ServiceWorkerRegistration & {
            sync: { register: (tag: string) => Promise<void> };
          }
        ).sync.register("sync-mutations");
      } catch (err) {
        console.warn("Background sync registration failed:", err);
      }
    }
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    // Set immediately before any await to prevent concurrent runs from both
    // passing the check above during the async connectivity test.
    this.isSyncing = true;

    const online = await isActuallyOnline();
    if (!online) {
      this.isSyncing = false;
      return;
    }

    await db.syncMetadata.put({
      id: "global",
      lastSyncTimestamp: Date.now(),
      syncInProgress: true,
    });

    let syncedCount = 0;

    try {
      const items = await db.syncQueue.orderBy("timestamp").toArray();

      for (const item of items) {
        // Re-check connectivity before each item (network can be flaky)
        const stillOnline = await isActuallyOnline();
        if (!stillOnline) break;

        try {
          await this.processSyncItem(item);
          await db.syncQueue.delete(item.id);
          syncedCount++;
        } catch (error) {
          if (isNetworkError(error)) break;
          await this.handleSyncError(item, error);
        }
      }

      if (syncedCount > 0) {
        toast.success(
          syncedCount === 1
            ? "1 canvi sincronitzat"
            : `${syncedCount} canvis sincronitzats`,
        );
        // Notify listeners that sync completed so they can refresh
        window.dispatchEvent(
          new CustomEvent("sync-completed", { detail: { count: syncedCount } }),
        );
      }
    } finally {
      this.isSyncing = false;
      await db.syncMetadata.put({
        id: "global",
        lastSyncTimestamp: Date.now(),
        syncInProgress: false,
      });
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // Re-read item from DB in case entityId/timestamp was updated by a previous sync
    let entityId = item.entityId;
    let timestamp = item.timestamp;
    if (item.id !== undefined) {
      const freshItem = await db.syncQueue.get(item.id);
      if (freshItem) {
        entityId = freshItem.entityId;
        timestamp = freshItem.timestamp;
      }
    }

    const body = {
      entityType: item.entityType,
      operation: item.operation,
      entityId: entityId,
      listId: item.listId,
      projectId: item.projectId,
      payload: item.payload,
      clientTimestamp: timestamp,
    };

    let response: Response;
    try {
      response = await fetch("/api/offline/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new NetworkError("Network unavailable");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Sync failed" }));

      if (response.status === 409) {
        throw new ConflictError(error.serverData, error.message);
      }

      throw new Error(error.message || "Sync failed");
    }

    const result = await response.json();

    // For creates with local- prefix, we need to update the local ID to the server ID
    if (
      item.operation === "create" &&
      entityId.startsWith("local-") &&
      result.id
    ) {
      await this.replaceLocalWithServerId(item.entityType, entityId, result);
    } else {
      await this.applyServerResponse(item.entityType, entityId, result);
    }
  }

  private async handleSyncError(
    item: SyncQueueItem,
    error: unknown,
  ): Promise<void> {
    if (isNetworkError(error)) return;

    if (error instanceof ConflictError) {
      const conflict = {
        entityType: item.entityType,
        entityId: item.entityId,
        localData: item.payload,
        serverData: error.serverData,
        localTimestamp: item.timestamp,
        serverTimestamp: (error.serverData.updatedAt as number) ?? Date.now(),
      };

      if (ConflictResolver.canAutoResolve(conflict)) {
        await ConflictResolver.autoResolve(conflict);
        await db.syncQueue.delete(item.id);
        return;
      }

      await this.markConflict(item.entityType, item.entityId, error.serverData);
      await db.syncQueue.delete(item.id);

      window.dispatchEvent(
        new CustomEvent("sync-conflict", {
          detail: { entityType: item.entityType, entityId: item.entityId },
        }),
      );

      toast.error("Hi ha conflictes que requereixen atenció");
      return;
    }

    const newRetryCount = item.retryCount + 1;

    if (newRetryCount >= MAX_RETRY_COUNT) {
      await db.syncQueue.delete(item.id);
      // Mark the IDB entity as synced so it doesn't stay orphaned as "pending"
      // with no queue entry forever. The server has the authoritative state;
      // the next seedFromServer will overwrite the IDB data with fresh server data.
      await this.applyServerResponse(item.entityType, item.entityId, {});
      console.error(
        "[sync-manager] item failed after max retries, discarding:",
        item.entityType,
        item.entityId,
      );
      toast.error("No s'ha pogut sincronitzar un canvi");
      return;
    }

    await db.syncQueue.update(item.id, {
      retryCount: newRetryCount,
      lastError: (error as Error).message,
    });
  }

  private async applyServerResponse(
    entityType: EntityType,
    entityId: string,
    serverData: Record<string, unknown>,
  ): Promise<void> {
    const table = this.getTable(entityType);
    if (!table) return;

    const existing = await table.get(entityId);
    if (existing) {
      await table.update(entityId, {
        ...serverData,
        _syncStatus: "synced",
        _serverVersion: (serverData.version as number) ?? 1,
        _localVersion: (serverData.version as number) ?? 1,
        _lastModified: Date.now(),
      });
    }
  }

  private async replaceLocalWithServerId(
    entityType: EntityType,
    localId: string,
    serverData: Record<string, unknown>,
  ): Promise<void> {
    const table = this.getTable(entityType);
    if (!table) return;

    const serverId = serverData.id as string;

    // Update any pending queue items that reference this local ID
    const pendingItems = await db.syncQueue
      .where("entityId")
      .equals(localId)
      .toArray();

    // Get server's updatedAt to use as new timestamp (avoid false conflicts)
    const serverUpdatedAt = (serverData.updatedAt as number) ?? Date.now();

    for (const item of pendingItems) {
      // Update both entityId AND timestamp to be after server's updatedAt
      await db.syncQueue.update(item.id, {
        entityId: serverId,
        timestamp: serverUpdatedAt + 1,
      });
    }

    // Get the local entry to preserve any local-only fields
    const localEntry = await table.get(localId);

    // Delete the local entry
    await table.delete(localId);

    // Build the new entry based on entity type
    const syncMeta = {
      _syncStatus: "synced" as const,
      _serverVersion: 1,
      _localVersion: 1,
      _lastModified: Date.now(),
    };

    switch (entityType) {
      case "listItem":
        await db.listItems.add({
          id: serverData.id as string,
          name: serverData.name as string,
          details: (serverData.details as string) ?? null,
          completed: serverData.completed as boolean,
          listId: serverData.listId as string,
          categoryId: (serverData.categoryId as string) ?? null,
          categoryName:
            (localEntry as { categoryName?: string })?.categoryName ?? null,
          createdAt: serverData.createdAt as number,
          createdBy: serverData.createdBy as string,
          updatedAt: serverData.updatedAt as number,
          updatedBy: (serverData.updatedBy as string) ?? null,
          ...syncMeta,
        });
        break;

      case "list":
        await db.lists.add({
          id: serverData.id as string,
          name: serverData.name as string,
          description: (serverData.description as string) ?? null,
          projectId: serverData.projectId as string,
          eventId: (serverData.eventId as string) ?? null,
          favorite: serverData.favorite as boolean,
          createdAt: serverData.createdAt as number,
          createdBy: serverData.createdBy as string,
          updatedAt: serverData.updatedAt as number,
          updatedBy: (serverData.updatedBy as string) ?? null,
          ...syncMeta,
        });
        break;

      case "event":
        await db.events.add({
          id: serverData.id as string,
          name: serverData.name as string,
          description: (serverData.description as string) ?? null,
          startAt: serverData.startAt as number,
          endAt: serverData.endAt as number,
          allDay: serverData.allDay as boolean,
          projectId: serverData.projectId as string,
          createdAt: serverData.createdAt as number,
          createdBy: serverData.createdBy as string,
          updatedAt: serverData.updatedAt as number,
          updatedBy: (serverData.updatedBy as string) ?? null,
          ...syncMeta,
        });
        break;

      case "note":
        await db.notes.add({
          id: serverData.id as string,
          name: serverData.name as string,
          contents: serverData.contents as string,
          format: serverData.format as string,
          projectId: serverData.projectId as string,
          createdAt: serverData.createdAt as number,
          createdBy: serverData.createdBy as string,
          updatedAt: serverData.updatedAt as number,
          updatedBy: (serverData.updatedBy as string) ?? null,
          ...syncMeta,
        });
        break;

      case "pot":
        await db.pots.add({
          id: serverData.id as string,
          name: serverData.name as string,
          projectId: serverData.projectId as string,
          settledAt: (serverData.settledAt as number) ?? null,
          createdAt: serverData.createdAt as number,
          createdBy: serverData.createdBy as string,
          ...syncMeta,
        });
        break;

      case "spending":
        await db.spendings.add({
          id: serverData.id as string,
          amount: serverData.amount as number,
          currency: serverData.currency as string,
          description: (serverData.description as string) ?? null,
          from: (serverData.from as string) ?? null,
          to: (serverData.to as string) ?? null,
          projectId: serverData.projectId as string,
          potId: (serverData.potId as string) ?? null,
          createdAt: serverData.createdAt as number,
          createdBy: serverData.createdBy as string,
          ...syncMeta,
        });
        break;
    }
  }

  private async markConflict(
    entityType: EntityType,
    entityId: string,
    serverData: Record<string, unknown>,
  ): Promise<void> {
    const table = this.getTable(entityType);
    if (!table) return;

    await table.update(entityId, {
      _syncStatus: "conflict",
      _serverData: serverData,
    });
  }

  private getTable(entityType: EntityType) {
    switch (entityType) {
      case "list":
        return db.lists;
      case "listItem":
        return db.listItems;
      case "category":
        return db.categories;
      case "event":
        return db.events;
      case "note":
        return db.notes;
      case "pot":
        return db.pots;
      case "spending":
        return db.spendings;
      default:
        return null;
    }
  }

  destroy() {
    if (this.onlineListener) {
      window.removeEventListener("online", this.onlineListener);
    }
    if (this.messageListener && navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener(
        "message",
        this.messageListener,
      );
    }
    this.initialized = false;
  }

  async clearQueue(): Promise<number> {
    const count = await db.syncQueue.count();
    await db.syncQueue.clear();
    return count;
  }

  async getQueueCount(): Promise<number> {
    return db.syncQueue.count();
  }

  // Reset retry counts for items that failed due to network issues
  async resetNetworkFailedRetries(): Promise<void> {
    const items = await db.syncQueue.toArray();
    for (const item of items) {
      if (
        item.lastError?.includes("fetch") ||
        item.lastError?.includes("network")
      ) {
        await db.syncQueue.update(item.id, {
          retryCount: 0,
          lastError: undefined,
        });
      }
    }
  }
}

class ConflictError extends Error {
  constructor(
    public serverData: Record<string, unknown>,
    message?: string,
  ) {
    super(message ?? "Conflict detected");
  }
}

class NetworkError extends Error {
  readonly isNetworkError = true;
  constructor(message?: string) {
    super(message ?? "Network unavailable");
    this.name = "NetworkError";
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if ((error as { isNetworkError?: boolean })?.isNetworkError === true)
    return true;
  if (error instanceof Error) {
    if (error.name === "NetworkError") return true;
    // Catch "Failed to fetch" and similar network errors
    if (error.message.toLowerCase().includes("fetch")) return true;
    if (error.message.toLowerCase().includes("network")) return true;
  }
  return false;
}

export const syncManager = new SyncManagerClass();

// Expose for debugging
if (typeof window !== "undefined") {
  (window as unknown as { syncManager: SyncManagerClass }).syncManager =
    syncManager;
}
