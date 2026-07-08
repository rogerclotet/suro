import { readRaw, writeRaw } from "@/lib/offline/storage";
import { widgetSnapshotKey } from "./constants";
import type { WidgetSnapshot } from "./types";

export function readWidgetSnapshot(projectId: string): WidgetSnapshot | null {
  const raw = readRaw(widgetSnapshotKey(projectId));
  if (raw === undefined || raw === "") {
    return null;
  }
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export function writeWidgetSnapshot(
  projectId: string,
  snapshot: WidgetSnapshot,
): void {
  writeRaw(widgetSnapshotKey(projectId), JSON.stringify(snapshot));
}

export function deleteWidgetSnapshot(projectId: string): void {
  writeRaw(widgetSnapshotKey(projectId), "");
}
