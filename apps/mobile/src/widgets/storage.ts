import * as v from "valibot";
import { normalizeLocale } from "@/i18n/config";
import { readRaw, writeRaw } from "@/lib/offline/storage";
import { widgetSnapshotKey } from "./constants";
import { widgetLabels } from "./labels";
import type { WidgetSnapshot } from "./types";

const cachedSnapshot = v.object({
  updatedAt: v.number(),
  locale: v.string(),
  signedIn: v.boolean(),
  projectId: v.optional(v.string()),
  projectName: v.optional(v.string()),
  homePath: v.optional(v.string()),
  events: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      when: v.string(),
      date: v.optional(
        v.object({
          day: v.number(),
          month: v.string(),
          isToday: v.boolean(),
        }),
      ),
      path: v.string(),
    }),
  ),
  // Older widgets cached tasks instead. Keep their events until the next sync.
  lists: v.optional(
    v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        done: v.number(),
        total: v.number(),
        path: v.string(),
      }),
    ),
    [],
  ),
});

export function readWidgetSnapshot(projectId: string): WidgetSnapshot | null {
  const raw = readRaw(widgetSnapshotKey(projectId));
  if (raw === undefined || raw === "") {
    return null;
  }
  try {
    const parsed = v.safeParse(cachedSnapshot, JSON.parse(raw));
    if (!parsed.success) return null;
    const locale = normalizeLocale(parsed.output.locale);
    return { ...parsed.output, locale, labels: widgetLabels(locale) };
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
