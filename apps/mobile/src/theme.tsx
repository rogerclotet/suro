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

/** The web app's typeface (loaded via expo-font in app/_layout.tsx). */
export const FONT = "Convergence_400Regular";

// Loosely mapped from the web app's Catppuccin palette (green primary, warm bg).
const palette = {
  light: {
    bg: "#f6f2ea",
    card: "#ffffff",
    // M3 `surfaceContainer`: a tonal step off `bg` so the Android nav bar reads
    // as a slightly elevated surface rather than blending into the page.
    navBar: "#efe8da",
    text: "#1e1e2e",
    muted: "#6c6f85",
    primary: "#40862f",
    onPrimary: "#ffffff",
    border: "#e4ddd0",
    inputBg: "#ffffff",
    // A muted warm "cork" accent for neutral markers (the list bullet) — warm
    // enough to fit the palette, soft enough not to pull focus like `primary`.
    marker: "#c2a368",
    // Catppuccin Latte "maroon" — destructive actions (delete, clear).
    danger: "#e64553",
    // Rotating per-event accents (Catppuccin Latte: blue, peach, green, mauve,
    // teal) — saturated enough to read on the light surface.
    event: ["#1e66f5", "#fe640b", "#40a02b", "#8839ef", "#179299"],
  },
  // Mapped from the web app's warm-brown dark theme (globals.css `.dark`),
  // converted from its oklch values to sRGB hex.
  dark: {
    bg: "#211a16",
    card: "#19120e",
    // M3 `surfaceContainer`: in dark themes the elevated surface is *lighter*
    // than `bg`, so the nav bar lifts off the page instead of merging with it.
    navBar: "#2b231d",
    text: "#ebe6de",
    muted: "#a0968f",
    primary: "#a7dc9a",
    onPrimary: "#142310",
    border: "#40362f",
    inputBg: "#40362f",
    // Lighter cork tan so the neutral marker stays legible on the dark surface.
    marker: "#c9b07f",
    // Catppuccin Mocha "maroon" — the dark counterpart of the light danger.
    danger: "#eba0ac",
    // The Catppuccin Mocha counterparts of the Latte accents above — softer
    // pastels that sit better on the warm-brown dark surface.
    event: ["#89b4fa", "#fab387", "#a6e3a1", "#cba6f7", "#94e2d5"],
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

  // Paint the native root view to match the active scheme. Without this, the
  // OS default (light) root view shows through for a frame while a tab's Stack
  // lazily mounts on iOS — a white flash when switching sections. (Android
  // already covers this via the tab navigator's backgroundColor.) Also keeps
  // the root correct when the in-app preference diverges from the OS scheme.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette[scheme].bg).catch(() => {});
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
    const pal = palette[scheme];
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
