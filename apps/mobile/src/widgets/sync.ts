import { requestWidgetUpdate } from "react-native-android-widget";
import { WIDGET_NAME } from "./constants";
import { renderHomeWidget } from "./HomeWidget";
import { snapshotForWidget } from "./resolve-snapshot";
import { writeWidgetSnapshot } from "./storage";
import type { WidgetSnapshot } from "./types";

export function persistProjectSnapshot(
  projectId: string,
  snapshot: WidgetSnapshot,
): void {
  writeWidgetSnapshot(projectId, snapshot);
}

/** Redraw every SuroHome widget instance from its configured group snapshot. */
export async function refreshAllWidgets(
  locale?: WidgetSnapshot["locale"],
): Promise<void> {
  await requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: (widgetInfo) =>
      renderHomeWidget(snapshotForWidget(widgetInfo.widgetId, locale)),
  });
}
