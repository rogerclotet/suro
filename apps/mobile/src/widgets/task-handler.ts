import { registerWidgetTaskHandler } from "react-native-android-widget";
import { renderHomeWidget } from "./HomeWidget";
import { readWidgetSnapshot } from "./storage";

registerWidgetTaskHandler(async ({ renderWidget }) => {
  renderWidget(renderHomeWidget(readWidgetSnapshot()));
});
