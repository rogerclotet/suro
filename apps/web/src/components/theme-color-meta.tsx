"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Keeps the `theme-color` meta tag (which drives the Android status/navigation
 * bar color) in sync with the *resolved* app theme rather than the system
 * `prefers-color-scheme`. A static media-query based meta tag would follow the
 * OS setting, which mismatches the app when the user picks a theme that differs
 * from their system preference.
 */
const THEME_COLORS = {
  light: "#f7e4d7",
  dark: "#17100c",
} as const;

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color =
      resolvedTheme === "light" ? THEME_COLORS.light : THEME_COLORS.dark;

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
}
