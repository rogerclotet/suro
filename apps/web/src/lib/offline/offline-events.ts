import { nanoid } from "nanoid";
import type { Event } from "@/app/_data/event";
import type { Project } from "@/app/_data/project";
import { createEvent as serverCreateEvent } from "@/app/[locale]/groups/[projectId]/calendar/_components/event/actions";
import {
  deleteEvent as serverDeleteEvent,
  editEvent as serverEditEvent,
} from "@/app/[locale]/groups/[projectId]/calendar/[eventId]/actions";
import { db } from "./db";
import { syncManager } from "./sync-manager";
import { toTimestamp } from "./to-timestamp";

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

export interface EventFormData {
  name: string;
  description?: string;
  dates: { from: Date; to: Date };
  allDay: boolean;
}

export async function createEventOffline(
  data: EventFormData,
  project: Project,
): Promise<string | undefined> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      await serverCreateEvent(
        {
          name: data.name,
          description: data.description ?? "",
          dates: { from: data.dates.from, to: data.dates.to },
          allDay: data.allDay,
        },
        project,
      );
      return undefined;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const entityId = `local-${nanoid()}`;
  const now = Date.now();
  const startAt = data.dates.from.getTime();
  let endAt = data.dates.to.getTime();

  if (data.allDay) {
    endAt += 24 * 60 * 60 * 1000; // Add a day for all-day events
  }

  await db.events.add({
    id: entityId,
    name: data.name,
    description: data.description ?? null,
    startAt,
    endAt,
    allDay: data.allDay,
    projectId: project.id,
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
    entityType: "event",
    operation: "create",
    entityId,
    projectId: project.id,
    payload: {
      name: data.name,
      description: data.description,
      startAt,
      endAt,
      allDay: data.allDay,
    },
  });

  return entityId;
}

export async function updateEventOffline(
  event: Event,
  data: EventFormData,
  project: Project,
): Promise<void> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      await serverEditEvent(
        event,
        {
          name: data.name,
          description: data.description ?? "",
          dates: { from: data.dates.from, to: data.dates.to },
          allDay: data.allDay,
        },
        project,
      );
      return;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const now = Date.now();
  const startAt = data.dates.from.getTime();
  let endAt = data.dates.to.getTime();

  if (data.allDay) {
    endAt += 24 * 60 * 60 * 1000;
  }

  const existing = await db.events.get(event.id);

  if (existing) {
    await db.events.update(event.id, {
      name: data.name,
      description: data.description ?? null,
      startAt,
      endAt,
      allDay: data.allDay,
      updatedAt: now,
      _syncStatus: "pending",
      _localVersion: (existing._localVersion ?? 0) + 1,
      _lastModified: now,
    });
  } else {
    await db.events.add({
      id: event.id,
      name: data.name,
      description: data.description ?? null,
      startAt,
      endAt,
      allDay: data.allDay,
      projectId: project.id,
      createdAt: event.createdAt ? toTimestamp(event.createdAt) : now,
      createdBy: event.createdBy,
      updatedAt: now,
      updatedBy: null,
      _syncStatus: "pending",
      _localVersion: 1,
      _serverVersion: 0,
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "event",
    operation: "update",
    entityId: event.id,
    projectId: project.id,
    payload: {
      name: data.name,
      description: data.description,
      startAt,
      endAt,
      allDay: data.allDay,
    },
  });
}

export async function deleteEventOffline(event: Event): Promise<void> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      await serverDeleteEvent(event);
      await db.events.delete(event.id);
      return;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const now = Date.now();
  const existing = await db.events.get(event.id);

  if (existing) {
    await db.events.update(event.id, {
      _deleted: true,
      _syncStatus: "pending",
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "event",
    operation: "delete",
    entityId: event.id,
    projectId: event.projectId,
    payload: {},
  });
}
