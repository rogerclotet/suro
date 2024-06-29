"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

const themes = ["dark", "light"] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    setInitialized(true);
  }, []);

  function toggleTheme() {
    setTheme(theme === themes[0] ? themes[1] : themes[0]);
  }

  return (
    <label role="button" className="btn btn-ghost swap swap-rotate">
      <input
        type="checkbox"
        name="theme"
        checked={theme === themes[0]}
        onChange={toggleTheme}
      />

      {initialized && (
        <>
          <Moon className="swap-on" />
          <Sun className="swap-off" />
        </>
      )}
    </label>
  );
}
