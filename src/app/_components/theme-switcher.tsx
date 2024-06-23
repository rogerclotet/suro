"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    setInitialized(true);
  }, []);

  function toggleTheme() {
    setTheme(theme === "night" ? "emerald" : "night");
  }

  return (
    <label role="button" className="btn btn-ghost swap swap-rotate">
      <input
        type="checkbox"
        name="theme"
        checked={theme === "emerald"}
        onChange={toggleTheme}
      />

      {initialized && (
        <>
          <Moon className="swap-off" />
          <Sun className="swap-on" />
        </>
      )}
    </label>
  );
}
