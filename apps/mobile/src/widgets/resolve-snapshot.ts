import { normalizeLocale } from "@/i18n/config";
import { readWidgetAuth } from "./auth-state";
import { getWidgetProjectId } from "./config";
import {
  signedOutWidgetSnapshot,
  unconfiguredWidgetSnapshot,
} from "./placeholders";
import { readWidgetSnapshot } from "./storage";
import type { WidgetSnapshot } from "./types";

/** Snapshot for one widget instance (configured group or placeholder). */
export function snapshotForWidget(
  widgetId: number,
  localeHint?: WidgetSnapshot["locale"],
): WidgetSnapshot {
  const auth = readWidgetAuth();
  const locale = normalizeLocale(localeHint ?? auth?.locale);
  if (auth && !auth.signedIn) {
    return signedOutWidgetSnapshot(locale);
  }

  const projectId = getWidgetProjectId(widgetId);
  if (!projectId) {
    return unconfiguredWidgetSnapshot(locale);
  }

  const cached = readWidgetSnapshot(projectId);
  if (cached) {
    return cached;
  }

  return {
    ...unconfiguredWidgetSnapshot(locale),
    projectId,
    homePath: `/${projectId}/home`,
  };
}

export { signedOutWidgetSnapshot };
