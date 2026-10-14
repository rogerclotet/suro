import { ConvexReactClient } from "convex/react";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
import {
  convexAuthSessionKeys,
  createAuthStorage,
  isKeychainLockedError,
  type SecureKeyStore,
} from "@/lib/auth-storage";
import { captureException } from "@/lib/error-reporting";

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

function secureKeyStore(
  options: SecureStore.SecureStoreOptions,
): SecureKeyStore {
  return {
    getItem: (key) => SecureStore.getItemAsync(key, options),
    setItem: (key, value) => SecureStore.setItemAsync(key, value, options),
    removeItem: (key) => SecureStore.deleteItemAsync(key, options),
  };
}

// The Convex client refreshes the session on a timer, which can fire after the
// screen locks. The default WHEN_UNLOCKED keychain items are unreadable then,
// so iOS keeps the tokens AFTER_FIRST_UNLOCK. The keychain never changes an
// existing item's accessibility, hence a new service that the old default-
// service items migrate into.
const IOS_AUTH_KEYCHAIN: SecureStore.SecureStoreOptions = {
  keychainService: "convex-auth",
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

function reportAuthWriteError(error: unknown) {
  // Expected before the first unlock after a reboot; the write is retried.
  if (!isKeychainLockedError(error)) {
    captureException(error, { action: "auth-storage-write" });
  }
}

function createNativeAuthStorage(authNamespace: string) {
  const storage = createAuthStorage(
    Platform.OS === "ios"
      ? {
          store: secureKeyStore(IOS_AUTH_KEYCHAIN),
          legacyStore: secureKeyStore({}),
          onWriteError: reportAuthWriteError,
        }
      : { store: secureKeyStore({}), onWriteError: reportAuthWriteError },
  );

  const syncKeychain = () => {
    storage
      .flushPendingWrites()
      .then(() => storage.migrateLegacy(convexAuthSessionKeys(authNamespace)))
      .catch((error: unknown) => {
        // A locked keychain resolves on the next foreground; anything else is a bug.
        if (!isKeychainLockedError(error)) {
          captureException(error, { action: "auth-storage-sync" });
        }
      });
  };
  syncKeychain();
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      syncKeychain();
    }
  });

  return storage;
}

// Convex Auth persists tokens here. Web falls back to the default (localStorage).
export const secureStorage =
  Platform.OS === "web" ? undefined : createNativeAuthStorage(convexUrl);
