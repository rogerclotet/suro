const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { withAppDelegate, withMainApplication } = require("expo/config-plugins");

function replaceNativeInit(contents, marker, template) {
  if (contents.includes("// Native events bypass")) return contents;
  if (contents.split(marker).length !== 2) {
    throw new Error(
      `Expected exactly one ${marker} from the Sentry Expo plugin`,
    );
  }
  return contents.replace(marker, template.trim());
}

// Register before the Sentry plugin: Expo runs these mods in reverse order,
// so its native startup calls exist before we replace them.
function withNativeErrorReporting(config, { enabled }) {
  if (!enabled) return config;
  config = withMainApplication(config, (mod) => {
    if (mod.modResults.language !== "kt") {
      throw new Error(
        "Native error reporting requires a Kotlin MainApplication",
      );
    }
    mod.modResults.contents = replaceNativeInit(
      mod.modResults.contents,
      "RNSentrySDK.init(this)",
      readFileSync(
        join(__dirname, "native-error-reporting/android.kt"),
        "utf8",
      ),
    );
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== "swift") {
      throw new Error("Native error reporting requires a Swift AppDelegate");
    }
    mod.modResults.contents = replaceNativeInit(
      mod.modResults.contents,
      "RNSentrySDK.start()",
      readFileSync(join(__dirname, "native-error-reporting/ios.swift"), "utf8"),
    );
    if (!mod.modResults.contents.includes("import Sentry\n")) {
      mod.modResults.contents = `import Sentry\n${mod.modResults.contents}`;
    }
    return mod;
  });
}

module.exports = withNativeErrorReporting;
module.exports.replaceNativeInit = replaceNativeInit;
