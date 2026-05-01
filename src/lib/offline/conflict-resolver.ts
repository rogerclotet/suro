import { db } from "./db";
import { syncManager } from "./sync-manager";

export type ConflictResolution = "keep-local" | "keep-server" | "merge";

export interface Conflict {
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  localTimestamp: number;
  serverTimestamp: number;
}

type EntityType = "list" | "listItem" | "category";

export class ConflictResolver {
  static canAutoResolve(conflict: Conflict): boolean {
    const { entityType, localData, serverData } = conflict;

    if (entityType === "listItem") {
      // Different items - both can exist
      if (localData.id !== serverData.id) {
        return true;
      }

      // Same item, only completion status changed on one side
      if (
        localData.name === serverData.name &&
        localData.details === serverData.details &&
        localData.categoryId === serverData.categoryId
      ) {
        // Both marked as completed - no conflict
        if (localData.completed && serverData.completed) {
          return true;
        }
        // Prefer completed state (bias toward done)
        return true;
      }
    }

    // Different lists - both can exist
    if (entityType === "list" && localData.id !== serverData.id) {
      return true;
    }

    // Different categories - both can exist
    if (entityType === "category" && localData.id !== serverData.id) {
      return true;
    }

    return false;
  }

  static async autoResolve(conflict: Conflict): Promise<void> {
    const { entityType, entityId, localData, serverData } = conflict;
    const table = ConflictResolver.getTable(entityType);
    if (!table) return;

    // For different items, just sync status
    if (localData.id !== serverData.id) {
      await table.update(entityId, {
        _syncStatus: "synced",
        _serverVersion: (serverData.version as number) ?? 1,
      });
      return;
    }

    // For list items with completion conflicts, prefer completed
    if (entityType === "listItem") {
      const preferCompleted =
        (localData.completed as boolean) || (serverData.completed as boolean);
      await table.update(entityId, {
        completed: preferCompleted,
        _syncStatus: "synced",
        _serverVersion: (serverData.version as number) ?? 1,
        _lastModified: Date.now(),
      });
    }
  }

  static async resolveManually(
    entityType: EntityType,
    entityId: string,
    resolution: ConflictResolution,
  ): Promise<void> {
    const table = ConflictResolver.getTable(entityType);
    if (!table) return;

    const entity = await table.get(entityId);
    if (!entity) return;

    const localData = { ...entity };
    const serverData = (entity._serverData ?? {}) as Record<string, unknown>;

    // Remove sync metadata from local data for comparison
    delete (localData as Record<string, unknown>)._syncStatus;
    delete (localData as Record<string, unknown>)._localVersion;
    delete (localData as Record<string, unknown>)._serverVersion;
    delete (localData as Record<string, unknown>)._lastModified;
    delete (localData as Record<string, unknown>)._serverData;
    delete (localData as Record<string, unknown>)._deleted;

    switch (resolution) {
      case "keep-local":
        // Re-queue with force flag
        await syncManager.enqueue({
          entityType,
          operation: "update",
          entityId,
          payload: { ...localData, _forceOverwrite: true },
        });
        await table.update(entityId, {
          _syncStatus: "pending",
          _serverData: undefined,
        });
        break;

      case "keep-server":
        // Apply server data locally
        await table.update(entityId, {
          ...serverData,
          _syncStatus: "synced",
          _serverVersion: (serverData.version as number) ?? 1,
          _localVersion: (serverData.version as number) ?? 1,
          _lastModified: Date.now(),
          _serverData: undefined,
        });
        break;

      case "merge": {
        // Merge: use server as base, overlay local non-null values
        const merged = ConflictResolver.mergeData(localData, serverData);
        await table.update(entityId, {
          ...merged,
          _syncStatus: "pending",
          _serverData: undefined,
        });
        await syncManager.enqueue({
          entityType,
          operation: "update",
          entityId,
          payload: merged,
        });
        break;
      }
    }
  }

  private static mergeData(
    local: Record<string, unknown>,
    server: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged = { ...server };

    for (const [key, value] of Object.entries(local)) {
      if (key.startsWith("_")) continue;
      if (value !== null && value !== undefined) {
        merged[key] = value;
      }
    }

    return merged;
  }

  private static getTable(entityType: string) {
    switch (entityType) {
      case "list":
        return db.lists;
      case "listItem":
        return db.listItems;
      case "category":
        return db.categories;
      default:
        return null;
    }
  }

  static async getConflicts(): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    const conflictedLists = await db.lists
      .where("_syncStatus")
      .equals("conflict")
      .toArray();

    for (const list of conflictedLists) {
      if (list._serverData) {
        conflicts.push({
          entityType: "list",
          entityId: list.id,
          localData: list as unknown as Record<string, unknown>,
          serverData: list._serverData,
          localTimestamp: list._lastModified,
          serverTimestamp: (list._serverData.updatedAt as number) ?? Date.now(),
        });
      }
    }

    const conflictedItems = await db.listItems
      .where("_syncStatus")
      .equals("conflict")
      .toArray();

    for (const item of conflictedItems) {
      if (item._serverData) {
        conflicts.push({
          entityType: "listItem",
          entityId: item.id,
          localData: item as unknown as Record<string, unknown>,
          serverData: item._serverData,
          localTimestamp: item._lastModified,
          serverTimestamp: (item._serverData.updatedAt as number) ?? Date.now(),
        });
      }
    }

    return conflicts;
  }
}
