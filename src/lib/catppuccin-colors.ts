export const CATPPUCCIN_COLORS = {
  rosewater: { bg: "#f5e0dc", fg: "#1e1e2e" },
  flamingo: { bg: "#f2cdcd", fg: "#1e1e2e" },
  pink: { bg: "#f5c2e7", fg: "#1e1e2e" },
  mauve: { bg: "#cba6f7", fg: "#1e1e2e" },
  red: { bg: "#f38ba8", fg: "#1e1e2e" },
  maroon: { bg: "#eba0ac", fg: "#1e1e2e" },
  peach: { bg: "#fab387", fg: "#1e1e2e" },
  yellow: { bg: "#f9e2af", fg: "#1e1e2e" },
  green: { bg: "#a6e3a1", fg: "#1e1e2e" },
  teal: { bg: "#94e2d5", fg: "#1e1e2e" },
  sky: { bg: "#89dceb", fg: "#1e1e2e" },
  sapphire: { bg: "#74c7ec", fg: "#1e1e2e" },
  blue: { bg: "#89b4fa", fg: "#1e1e2e" },
  lavender: { bg: "#b4befe", fg: "#1e1e2e" },
} as const;

export type CatppuccinColor = keyof typeof CATPPUCCIN_COLORS;

export const CATPPUCCIN_COLOR_KEYS = Object.keys(
  CATPPUCCIN_COLORS,
) as CatppuccinColor[];

export function getRandomColor(): CatppuccinColor {
  return CATPPUCCIN_COLOR_KEYS[
    Math.floor(Math.random() * CATPPUCCIN_COLOR_KEYS.length)
  ]!;
}
