import type { ConfigContext, ExpoConfig } from "expo/config";

import appJson from "./app.json";

// Universal links need a dev certificate even for simulator builds (Expo checks
// com.apple.developer.associated-domains). EAS store builds keep them; local
// `expo run:ios` omits them so you can run without Xcode signing setup.
const isEasBuild = process.env.EAS_BUILD === "true";

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = appJson.expo as ExpoConfig;
  return {
    ...config,
    ...base,
    ios: {
      ...base.ios,
      associatedDomains: isEasBuild ? ["applinks:suro.clotet.dev"] : undefined,
    },
  };
};
