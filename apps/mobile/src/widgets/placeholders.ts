import { widgetLabels } from "./labels";
import type { WidgetSnapshot } from "./types";

/** Signed-out placeholder shown on every widget instance. */
export function signedOutWidgetSnapshot(
  locale: WidgetSnapshot["locale"],
): WidgetSnapshot {
  const labels = widgetLabels(locale);
  return {
    updatedAt: Date.now(),
    locale,
    signedIn: false,
    labels,
    events: [],
    tasks: [],
  };
}

/** Shown when the instance has no group selected yet. */
export function unconfiguredWidgetSnapshot(
  locale: WidgetSnapshot["locale"],
): WidgetSnapshot {
  const labels = widgetLabels(locale);
  return {
    updatedAt: Date.now(),
    locale,
    signedIn: true,
    labels,
    events: [],
    tasks: [],
  };
}
