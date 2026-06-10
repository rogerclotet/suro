// Catppuccin palette keys (ported from apps/web/src/lib/catppuccin-colors.ts).
// A project's `color` is one of these names; the mobile theme maps it to a hex.
export const CATPPUCCIN_COLOR_KEYS = [
  "rosewater",
  "flamingo",
  "pink",
  "mauve",
  "red",
  "maroon",
  "peach",
  "yellow",
  "green",
  "teal",
  "sky",
  "sapphire",
  "blue",
  "lavender",
] as const;

export function getRandomColor(): string {
  const index = Math.floor(Math.random() * CATPPUCCIN_COLOR_KEYS.length);
  return CATPPUCCIN_COLOR_KEYS[index] ?? "blue";
}
