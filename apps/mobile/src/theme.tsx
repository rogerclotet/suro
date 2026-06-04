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

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? palette.dark : palette.light;
}
