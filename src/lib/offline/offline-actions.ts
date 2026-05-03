import { nanoid } from "nanoid";
import type { List } from "@/app/_data/list";
import {
  createListItem as serverCreateListItem,
  deleteListItem as serverDeleteListItem,
  updateListItem as serverUpdateListItem,
} from "@/app/[locale]/groups/[projectId]/lists/[listId]/_components/list-item/actions";
import { db } from "./db";
import { syncManager } from "./sync-manager";

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

export async function createListItemOffline(
  list: List,
  data: { name: string; categoryId: string | null },
  categoryName?: string | null,
): Promise<string | undefined> {
  // Validate list object
  if (!list?.id) {
    console.error("createListItemOffline: list.id is missing", list);
    throw new Error("Invalid list object");
  }

  // Check actual connectivity (navigator.onLine is unreliable when loading from SW cache)
  const online = await isActuallyOnline();

  // Try server first if we're actually online
  if (online) {
    try {
      await serverCreateListItem(list, {
        name: data.name,
        completed: false,
        categoryId: data.categoryId,
      });
      return undefined;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
      // Fall through to offline mode
    }
  }

  // Offline: add to IndexedDB and queue for sync
  const entityId = `local-${nanoid()}`;
  const now = Date.now();

  await db.listItems.add({
    id: entityId,
    name: data.name,
    details: null,
    completed: false,
    listId: list.id,
    categoryId: data.categoryId,
    categoryName: categoryName ?? null,
    createdAt: now,
    createdBy: "",
    updatedAt: now,
    updatedBy: null,
    _syncStatus: "pending",
    _localVersion: 1,
    _serverVersion: 0,
    _lastModified: now,
  });

  await syncManager.enqueue({
    entityType: "listItem",
    operation: "create",
    entityId,
    listId: list.id,
    projectId: list.projectId ?? "",
    payload: {
      name: data.name,
      categoryId: data.categoryId,
    },
  });

  return entityId;
}

export async function updateListItemOffline(
  list: List,
  itemId: string,
  name: string,
  details: string,
  completed: boolean,
  categoryId: string | null,
  categoryName?: string | null,
): Promise<void> {
  // Validate list object
  if (!list?.id) {
    console.error("updateListItemOffline: list.id is missing", list);
    throw new Error("Invalid list object");
  }

  // Check actual connectivity
  const online = await isActuallyOnline();

  // Try server first if we're actually online
  if (online) {
    try {
      await serverUpdateListItem(
        list,
        itemId,
        name,
        details,
        completed,
        categoryId,
      );
      return;
    } catch {
      // Fall through to offline mode
    }
  }

  // Offline: update IndexedDB and queue for sync
  const now = Date.now();
  const existing = await db.listItems.get(itemId);

  if (existing) {
    await db.listItems.update(itemId, {
      name,
      details,
      completed,
      categoryId,
      categoryName: categoryName ?? existing.categoryName,
      updatedAt: now,
      _syncStatus: "pending",
      _localVersion: (existing._localVersion ?? 0) + 1,
      _lastModified: now,
    });
  } else {
    // Item not in offline DB yet, add it
    await db.listItems.add({
      id: itemId,
      name,
      details,
      completed,
      listId: list.id,
      categoryId,
      categoryName: categoryName ?? null,
      createdAt: now,
      createdBy: "",
      updatedAt: now,
      updatedBy: null,
      _syncStatus: "pending",
      _localVersion: 1,
      _serverVersion: 0,
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "listItem",
    operation: "update",
    entityId: itemId,
    listId: list.id,
    projectId: list.projectId ?? "",
    payload: {
      name,
      details,
      completed,
      categoryId,
    },
  });
}

export async function deleteListItemOffline(
  list: List,
  itemId: string,
): Promise<void> {
  // Validate list object
  if (!list?.id) {
    console.error("deleteListItemOffline: list.id is missing", list);
    throw new Error("Invalid list object");
  }

  // Check actual connectivity
  const online = await isActuallyOnline();

  // Try server first if we're actually online
  if (online) {
    try {
      await serverDeleteListItem(list, itemId);
      await db.listItems.delete(itemId);
      return;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
      // Fall through to offline mode
    }
  }

  // Offline: mark as deleted and queue for sync
  const now = Date.now();
  const existing = await db.listItems.get(itemId);

  if (existing) {
    await db.listItems.update(itemId, {
      _deleted: true,
      _syncStatus: "pending",
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "listItem",
    operation: "delete",
    entityId: itemId,
    listId: list.id,
    projectId: list.projectId ?? "",
    payload: {},
  });
}

// Re-export original actions for cases where offline isn't needed
export {
  serverCreateListItem as createListItem,
  serverUpdateListItem as updateListItem,
  serverDeleteListItem as deleteListItem,
};
