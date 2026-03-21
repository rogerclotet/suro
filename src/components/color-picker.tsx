"use client";

import { CheckIcon } from "lucide-react";
import {
  CATPPUCCIN_COLOR_KEYS,
  CATPPUCCIN_COLORS,
  type CatppuccinColor,
} from "@/lib/catppuccin-colors";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: CatppuccinColor | null | undefined;
  onChange: (color: CatppuccinColor) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATPPUCCIN_COLOR_KEYS.map((key) => {
        const color = CATPPUCCIN_COLORS[key];
        const isSelected = value === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110",
              isSelected &&
                "ring-ring ring-2 ring-offset-2 ring-offset-background",
            )}
            style={{ backgroundColor: color.bg }}
            aria-label={key}
          >
            {isSelected && (
              <CheckIcon className="h-4 w-4" style={{ color: color.fg }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
