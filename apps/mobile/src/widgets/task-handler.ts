import { registerWidgetTaskHandler } from "react-native-android-widget";
import { removeWidgetProjectId } from "./config";
import { renderHomeWidget } from "./HomeWidget";
import { snapshotForWidget } from "./resolve-snapshot";

registerWidgetTaskHandler(
  async ({ widgetInfo, widgetAction, renderWidget }) => {
    if (widgetAction === "WIDGET_DELETED") {
      removeWidgetProjectId(widgetInfo.widgetId);
      return;
    }
    renderWidget(renderHomeWidget(snapshotForWidget(widgetInfo.widgetId)));
  },
);
