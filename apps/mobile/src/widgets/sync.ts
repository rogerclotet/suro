import { requestWidgetUpdate } from "react-native-android-widget";
import { WIDGET_NAME } from "./constants";
import { renderHomeWidget } from "./HomeWidget";
import { readWidgetSnapshot, writeWidgetSnapshot } from "./storage";
import type { WidgetSnapshot } from "./types";

export function persistAndRefreshWidget(snapshot: WidgetSnapshot): void {
  writeWidgetSnapshot(snapshot);
  void requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: () => renderHomeWidget(readWidgetSnapshot()),
  });
}
