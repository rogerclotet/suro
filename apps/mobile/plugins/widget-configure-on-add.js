const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/**
 * react-native-android-widget only wires up `android:configure` when
 * `widgetFeatures` is set. We keep that flag in app.json so the config
 * activity is generated, then strip `android:widgetFeatures` so Android opens
 * the picker when the widget is added (not via long-press reconfigure).
 */
function withWidgetConfigureOnAdd(config) {
  return withDangerousMod(config, [
    "android",
    (modConfig) => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        "android/app/src/main/res/xml",
      );
      if (!fs.existsSync(xmlDir)) {
        return modConfig;
      }
      for (const file of fs.readdirSync(xmlDir)) {
        if (!file.startsWith("widgetprovider_") || !file.endsWith(".xml")) {
          continue;
        }
        const xmlPath = path.join(xmlDir, file);
        const xml = fs.readFileSync(xmlPath, "utf8");
        const next = xml.replace(/\n\s*android:widgetFeatures="[^"]*"/, "");
        if (next !== xml) {
          fs.writeFileSync(xmlPath, next);
        }
      }
      return modConfig;
    },
  ]);
}

module.exports = withWidgetConfigureOnAdd;
