import { readRaw, writeRaw } from "@/lib/offline/storage";
import { SNAPSHOT_KEY } from "./constants";
import type { WidgetSnapshot } from "./types";

export function readWidgetSnapshot(): WidgetSnapshot | null {
  const raw = readRaw(SNAPSHOT_KEY);
  if (raw === undefined) {
    return null;
  }
  try {
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export function writeWidgetSnapshot(snapshot: WidgetSnapshot): void {
  writeRaw(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function clearWidgetSnapshot(): void {
  writeRaw(SNAPSHOT_KEY, "");
}
