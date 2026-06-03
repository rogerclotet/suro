import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Remembers the group the user was last in, so launches resume there instead
// of dropping back to the group list.
const KEY = "suro.lastProjectId";

// SecureStore is unavailable on web (react-native-web); fall back to
// localStorage so the preference still survives reloads in the browser.
export async function getLastProjectId(): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  }
  return SecureStore.getItemAsync(KEY);
}

export async function setLastProjectId(projectId: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(KEY, projectId);
    return;
  }
  await SecureStore.setItemAsync(KEY, projectId);
}
