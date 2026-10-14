import { FONT_DISPLAY_NATIVE as FONT, nativePalette } from "design-tokens";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import { isKeychainLockedError } from "@/lib/auth-storage";
import { captureException } from "@/lib/error-reporting";
import { readRaw, writeRaw } from "@/lib/offline/storage";

export { FONT };

/**
 * Convergence ships only a 400 weight, so display text must ask for exactly
 * that. Given a bold weight, iOS falls back to the regular face, but Android
 * finds no bold variant of the custom family and draws the system font instead.
 */
export const DISPLAY_FONT = { fontFamily: FONT, fontWeight: "400" } as const;

export type Theme = (typeof nativePalette)[keyof typeof nativePalette];
type Scheme = keyof typeof nativePalette;

/** How the active color scheme is chosen: forced light/dark, or follow the OS. */
export type ThemePreference = Scheme | "system";

const PREFERENCE_KEY = "suro.theme-preference";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

type ThemeContextValue = {
  scheme: Scheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  const stored = readRaw(PREFERENCE_KEY) ?? null;
  return isThemePreference(stored) ? stored : "system";
}

/**
 * Builds before this one kept the preference in SecureStore. Copy it over once
 * so upgrading doesn't reset a forced light/dark choice. Storing "system" when
 * there was nothing to copy marks the migration done.
 */
async function migrateSecureStorePreference(): Promise<ThemePreference | null> {
  if (readRaw(PREFERENCE_KEY) !== undefined) {
    return null;
  }
  const stored = await SecureStore.getItemAsync(PREFERENCE_KEY);
  // The user may have picked a theme while the keychain read was in flight.
  if (readRaw(PREFERENCE_KEY) !== undefined) {
    return null;
  }
  const migrated = isThemePreference(stored) ? stored : "system";
  writeRaw(PREFERENCE_KEY, migrated);
  if (stored !== null) {
    await SecureStore.deleteItemAsync(PREFERENCE_KEY);
  }
  return migrated;
}

/**
 * Holds the user's theme preference (persisted in the on-device MMKV store) and
 * resolves it against the live OS scheme. Replaces the web's next-themes — the
 * preference lives on-device, so it doesn't round-trip to the shared user
 * record. MMKV reads synchronously, so the first frame already has the saved
 * scheme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);

  useEffect(() => {
    let active = true;
    migrateSecureStorePreference()
      .then((migrated) => {
        if (active && migrated !== null) {
          setPreferenceState(migrated);
        }
      })
      .catch((error: unknown) => {
        // A locked keychain leaves the old value for the next launch to migrate.
        if (!isKeychainLockedError(error)) {
          captureException(error, { action: "theme-preference-migration" });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeRaw(PREFERENCE_KEY, next);
  }, []);

  const scheme: Scheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  // Paint the native root view to match the active scheme. Without this, the
  // OS default (light) root view shows through for a frame while a tab's Stack
  // lazily mounts on iOS — a white flash when switching sections. (Android
  // already covers this via the tab navigator's backgroundColor.) Also keeps
  // the root correct when the in-app preference diverges from the OS scheme.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(nativePalette[scheme].bg).catch(
      () => {},
    );
  }, [scheme]);

  // Force native UIKit chrome (nav bar, header buttons, tab bar, system
  // dialogs) onto the chosen appearance. `userInterfaceStyle: "automatic"`
  // otherwise leaves them on the OS appearance, so a dark in-app theme over a
  // light OS flashes the native bars white as react-native-screens rebuilds
  // them on a section change. "unspecified" restores OS-following for "system".
  useEffect(() => {
    Appearance.setColorScheme(
      preference === "system" ? "unspecified" : preference,
    );
  }, [preference]);

  const value = useMemo(
    () => ({ scheme, preference, setPreference }),
    [scheme, preference, setPreference],
  );

  // React Navigation theme for the native stacks. The native header reads this
  // theme's `dark` flag to set the iOS header's `experimental_userInterfaceStyle`
  // — without a dark theme here it forces the header (and its Liquid Glass bar
  // buttons) to light, so the glass capsules flash white on a section change.
  // Colors are mapped to our palette so the navigator's defaults match.
  const navigationTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    const pal = nativePalette[scheme];
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: pal.primary,
        background: pal.bg,
        card: pal.bg,
        text: pal.text,
        border: pal.border,
        notification: pal.primary,
      },
    };
  }, [scheme]);

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        {/* Keep the OS status bar legible against the resolved scheme. */}
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

/** The resolved palette for the active scheme. */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  return nativePalette[ctx?.scheme ?? "light"];
}

/** The theme preference and its setter, for the profile screen's selector. */
export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useThemePreference must be used within a ThemeProvider");
  }
  return { preference: ctx.preference, setPreference: ctx.setPreference };
}
