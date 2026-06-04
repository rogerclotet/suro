import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

/** The web app's typeface (loaded via expo-font in app/_layout.tsx). */
export const FONT = "Convergence_400Regular";

// Loosely mapped from the web app's Catppuccin palette (green primary, warm bg).
const palette = {
  light: {
    bg: "#f6f2ea",
    card: "#ffffff",
    text: "#1e1e2e",
    muted: "#6c6f85",
    primary: "#40862f",
    onPrimary: "#ffffff",
    // Tonal pair for M3 surfaces (FAB container, tab indicator).
    primaryContainer: "#c6e7bb",
    onPrimaryContainer: "#0c3900",
    border: "#e4ddd0",
    inputBg: "#ffffff",
  },
  dark: {
    bg: "#1e1e2e",
    card: "#28283b",
    text: "#cdd6f4",
    muted: "#9399b2",
    primary: "#a6e3a1",
    onPrimary: "#1e1e2e",
    primaryContainer: "#33522c",
    onPrimaryContainer: "#c2f0bd",
    border: "#3a3a4f",
    inputBg: "#28283b",
  },
};

export type Theme = (typeof palette)["light"];
type Scheme = keyof typeof palette;

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

/**
 * Holds the user's theme preference (persisted in SecureStore) and resolves it
 * against the live OS scheme. Replaces the web's next-themes — the preference
 * lives on-device, so it doesn't round-trip to the shared user record.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  // Restore the saved preference once; default to "system" until it loads.
  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(PREFERENCE_KEY)
      .then((stored) => {
        if (active && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // A missing/unreadable preference just leaves the "system" default.
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void SecureStore.setItemAsync(PREFERENCE_KEY, next).catch(() => {});
  }, []);

  const scheme: Scheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const value = useMemo(
    () => ({ scheme, preference, setPreference }),
    [scheme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* Keep the OS status bar legible against the resolved scheme. */}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

/** The resolved palette for the active scheme. */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  return palette[ctx?.scheme ?? "light"];
}

/** The theme preference and its setter, for the profile screen's selector. */
export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useThemePreference must be used within a ThemeProvider");
  }
  return { preference: ctx.preference, setPreference: ctx.setPreference };
}
