import { ConvexReactClient } from "convex/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  // Fail with the actual cause: without this, ConvexReactClient throws a
  // cryptic URL error on a misconfigured build's first frame. Native builds
  // inject the URL from the eas.json profile env; `expo start` loads .env.
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is not set — check the eas.json build profile (native) or apps/mobile/.env (expo start).",
  );
}

export const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

// Convex Auth persists tokens here. Web falls back to the default (localStorage).
export const secureStorage =
  Platform.OS === "web"
    ? undefined
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) =>
          SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };
