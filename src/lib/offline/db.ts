import Dexie, { type EntityTable } from "dexie";

export type SyncStatus = "synced" | "pending" | "conflict";

export interface SyncableEntity {
  _syncStatus: SyncStatus;
  _localVersion: number;
  _serverVersion: number;
  _lastModified: number;
  _deleted?: boolean;
  _serverData?: Record<string, unknown>;
}

// Lists
export interface OfflineList extends SyncableEntity {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  eventId: string | null;
  favorite: boolean;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string | null;
}

export interface OfflineListItem extends SyncableEntity {
  id: string;
  name: string;
  details: string | null;
  completed: boolean;
  listId: string;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string | null;
}

export interface OfflineCategory extends SyncableEntity {
  id: string;
  name: string;
  projectId: string;
}

// Calendar Events
export interface OfflineEvent extends SyncableEntity {
  id: string;
  name: string;
  description: string | null;
  startAt: number;
  endAt: number;
  allDay: boolean;
  projectId: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string | null;
}

// Notes
export interface OfflineNote extends SyncableEntity {
  id: string;
  name: string;
  contents: string;
  format: string;
  projectId: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string | null;
}

// Spendings
export interface OfflinePot extends SyncableEntity {
  id: string;
  name: string;
  projectId: string;
  settledAt: number | null;
  createdAt: number;
  createdBy: string;
}

export interface OfflineSpending extends SyncableEntity {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  from: string | null;
  to: string | null;
  projectId: string;
  potId: string | null;
  createdAt: number;
  createdBy: string;
}

export type EntityType =
  | "list"
  | "listItem"
  | "category"
  | "event"
  | "note"
  | "pot"
  | "spending";

export interface SyncQueueItem {
  id?: number;
  entityType: EntityType;
  operation: "create" | "update" | "delete";
  entityId: string;
  listId?: string;
  projectId?: string;
  potId?: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncMetadata {
  id: string;
  lastSyncTimestamp: number;
  syncInProgress: boolean;
}

const db = new Dexie("familia") as Dexie & {
  lists: EntityTable<OfflineList, "id">;
  listItems: EntityTable<OfflineListItem, "id">;
  categories: EntityTable<OfflineCategory, "id">;
  events: EntityTable<OfflineEvent, "id">;
  notes: EntityTable<OfflineNote, "id">;
  pots: EntityTable<OfflinePot, "id">;
  spendings: EntityTable<OfflineSpending, "id">;
  syncQueue: EntityTable<SyncQueueItem, "id">;
  syncMetadata: EntityTable<SyncMetadata, "id">;
};

db.version(2).stores({
  lists: "id, projectId, name, favorite, _syncStatus, updatedAt",
  listItems: "id, listId, categoryId, name, completed, _syncStatus",
  categories: "id, projectId, name, _syncStatus",
  events: "id, projectId, startAt, endAt, _syncStatus",
  notes: "id, projectId, name, _syncStatus",
  pots: "id, projectId, _syncStatus",
  spendings: "id, projectId, potId, _syncStatus",
  syncQueue: "++id, entityType, entityId, timestamp",
  syncMetadata: "id",
});

export { db };
