"use client";

import type { CalendarEvent } from "@/app/_data/event";
import { db } from "./db";

/**
 * Writes server-fetched events into IndexedDB so they're available for instant
 * offline / month-switching reads in future renders.
 * Skips events that have pending local changes to avoid overwriting them.
 */
export async function cacheEventsToIDB(events: CalendarEvent[]): Promise<void> {
  if (events.length === 0) return;

  const ids = events.map((e) => e.id);
  const existing = await db.events.bulkGet(ids);
  const existingMap = new Map(
    existing
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => [e.id, e]),
  );

  const toWrite = events
    .filter((e) => existingMap.get(e.id)?._syncStatus !== "pending")
    .map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description ?? null,
      startAt: e.startAt.getTime(),
      endAt: e.endAt.getTime(),
      allDay: e.allDay,
      projectId: e.projectId,
      createdAt:
        e.createdAt instanceof Date ? e.createdAt.getTime() : Date.now(),
      createdBy: e.createdBy,
      updatedAt:
        e.updatedAt instanceof Date ? e.updatedAt.getTime() : Date.now(),
      updatedBy: e.updatedBy ?? null,
      _syncStatus: "synced" as const,
      _localVersion: 0,
      _serverVersion: 0,
      _lastModified: Date.now(),
    }));

  if (toWrite.length > 0) {
    await db.events.bulkPut(toWrite);
  }
}

/**
 * Reads all non-deleted events for a given month range from IndexedDB.
 * Includes both server-synced and pending-local events.
 */
export async function loadMonthEventsFromIDB(
  monthStart: Date,
  monthEnd: Date,
  projectId: string,
): Promise<CalendarEvent[]> {
  const items = await db.events
    .where("projectId")
    .equals(projectId)
    .filter(
      (e) =>
        !e._deleted &&
        e.startAt < monthEnd.getTime() &&
        e.endAt > monthStart.getTime(),
    )
    .toArray();

  return items.map(
    (e) =>
      ({
        id: e.id,
        name: e.name,
        description: e.description,
        startAt: new Date(e.startAt),
        endAt: new Date(e.endAt),
        allDay: e.allDay,
        projectId: e.projectId,
        createdAt: new Date(e.createdAt),
        createdBy: e.createdBy,
        updatedAt: new Date(e.updatedAt),
        updatedBy: e.updatedBy,
        files: [],
      }) as unknown as CalendarEvent,
  );
}
