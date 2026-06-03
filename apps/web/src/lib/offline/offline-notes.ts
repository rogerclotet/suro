import { nanoid } from "nanoid";
import type { Note } from "@/app/_data/note";
import type { Project } from "@/app/_data/project";
import { createNote as serverCreateNote } from "@/app/[locale]/groups/[projectId]/notes/_components/create-note-button/actions";
import {
  deleteNote as serverDeleteNote,
  editNote as serverEditNote,
} from "@/app/[locale]/groups/[projectId]/notes/[noteId]/actions";
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

export interface NoteFormData {
  name: string;
  contents: string;
  format: string;
}

export async function createNoteOffline(
  project: Project,
  data: NoteFormData,
): Promise<string | undefined> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      const noteId = await serverCreateNote(project, data);
      return noteId;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const entityId = `local-${nanoid()}`;
  const now = Date.now();

  await db.notes.add({
    id: entityId,
    name: data.name,
    contents: data.contents,
    format: data.format,
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
    entityType: "note",
    operation: "create",
    entityId,
    projectId: project.id,
    payload: {
      name: data.name,
      contents: data.contents,
      format: data.format,
    },
  });

  return entityId;
}

export async function updateNoteOffline(
  note: Note,
  data: NoteFormData,
): Promise<void> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      await serverEditNote(note, data);
      return;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const now = Date.now();
  const existing = await db.notes.get(note.id);

  if (existing) {
    await db.notes.update(note.id, {
      name: data.name,
      contents: data.contents,
      format: data.format,
      updatedAt: now,
      _syncStatus: "pending",
      _localVersion: (existing._localVersion ?? 0) + 1,
      _lastModified: now,
    });
  } else {
    await db.notes.add({
      id: note.id,
      name: data.name,
      contents: data.contents,
      format: data.format,
      projectId: note.projectId,
      createdAt: note.createdAt ? toTimestamp(note.createdAt) : now,
      createdBy: note.createdBy,
      updatedAt: now,
      updatedBy: null,
      _syncStatus: "pending",
      _localVersion: 1,
      _serverVersion: 0,
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "note",
    operation: "update",
    entityId: note.id,
    projectId: note.projectId,
    payload: {
      name: data.name,
      contents: data.contents,
      format: data.format,
    },
  });
}

export async function deleteNoteOffline(note: Note): Promise<void> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      await serverDeleteNote(note);
      await db.notes.delete(note.id);
      return;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const now = Date.now();
  const existing = await db.notes.get(note.id);

  if (existing) {
    await db.notes.update(note.id, {
      _deleted: true,
      _syncStatus: "pending",
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "note",
    operation: "delete",
    entityId: note.id,
    projectId: note.projectId,
    payload: {},
  });
}
