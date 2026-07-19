import { LATTE_EVENT, MOCHA_EVENT } from "./events";

/** Raw brand palette (light mode). */
export const brand = {
  background: "#F3ECDF",
  text1: "#1B2A22",
  text2: "#4E4E4E",
  text3: "#A3BC8D",
  stroke: "#C3B18D",
  primary: "#314E2A",
  primaryLight: "#DCE6CB",
  accent: "#C97A3D",
  error: "#D64F45",
  success: "#69D373",
} as const;

/**
 * Dark-mode counterpart of `brand` — same warm cork/beige hue family as light,
 * pushed to deep brown surfaces. Green stays on primary accents, not the base.
 */
export const brandDark = {
  background: "#211A16",
  text1: "#F3ECDF",
  text2: "#A0968F",
  text3: "#A3BC8D",
  stroke: "#40362F",
  primary: "#A3BC8D",
  primaryLight: "#2B231D",
  accent: "#E0A066",
  error: "#EF8278",
  success: "#7AE088",
} as const;

/** Conventional PDF red — unchanged across the redesign. */
export const PDF_LIGHT = "#e2574c";
export const PDF_DARK = "#f0857b";

export type NativeTheme = {
  bg: string;
  card: string;
  navBar: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  muted: string;
  primary: string;
  primaryLight: string;
  onPrimary: string;
  border: string;
  inputBg: string;
  marker: string;
  danger: string;
  success: string;
  pdf: string;
  event: readonly string[];
  eventOnPrimary: readonly string[];
};

export const nativeLight = {
  bg: brand.background,
  card: "#ffffff",
  navBar: brand.primaryLight,
  text: brand.text1,
  textSecondary: brand.text2,
  textTertiary: brand.text3,
  muted: brand.text2,
  primary: brand.primary,
  primaryLight: brand.primaryLight,
  onPrimary: "#ffffff",
  border: brand.stroke,
  inputBg: "#ffffff",
  marker: brand.accent,
  danger: brand.error,
  success: brand.success,
  pdf: PDF_LIGHT,
  event: LATTE_EVENT,
  eventOnPrimary: MOCHA_EVENT,
} as const satisfies NativeTheme;

/** Dark theme — structural mirror of `nativeLight` using `brandDark`. */
export const nativeDark = {
  bg: brandDark.background,
  // Inset card: one step darker than the page.
  card: "#19120E",
  // M3 `surfaceContainer`: lifts *lighter* than `bg` in dark themes.
  navBar: "#2B231D",
  text: brandDark.text1,
  textSecondary: brandDark.text2,
  textTertiary: brandDark.text3,
  muted: brandDark.text2,
  primary: brandDark.primary,
  primaryLight: brandDark.primaryLight,
  onPrimary: brand.text1,
  border: brandDark.stroke,
  inputBg: "#332C28",
  marker: brandDark.accent,
  danger: brandDark.error,
  success: brandDark.success,
  pdf: PDF_DARK,
  event: MOCHA_EVENT,
  eventOnPrimary: LATTE_EVENT,
} as const satisfies NativeTheme;

export const nativePalette = {
  light: nativeLight,
  dark: nativeDark,
} as const;

export type WebTheme = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  primaryLight: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  pdf: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarActive: string;
  sidebarActiveForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  event: readonly string[];
  eventOnPrimary: readonly string[];
};

export const webLight = {
  background: brand.background,
  foreground: brand.text1,
  card: "#ffffff",
  cardForeground: brand.text1,
  popover: "#ffffff",
  popoverForeground: brand.text1,
  primary: brand.primary,
  primaryForeground: "#ffffff",
  primaryLight: brand.primaryLight,
  secondary: brand.accent,
  secondaryForeground: brand.text1,
  muted: brand.primaryLight,
  mutedForeground: brand.text2,
  accent: brand.primaryLight,
  accentForeground: brand.primary,
  destructive: brand.error,
  destructiveForeground: "#ffffff",
  success: brand.success,
  pdf: PDF_LIGHT,
  border: brand.stroke,
  input: brand.stroke,
  ring: brand.primary,
  sidebar: brand.primaryLight,
  sidebarForeground: brand.text1,
  sidebarPrimary: brand.primary,
  sidebarPrimaryForeground: "#ffffff",
  sidebarAccent: brand.accent,
  sidebarAccentForeground: "#ffffff",
  sidebarActive: brand.text3,
  sidebarActiveForeground: brand.text1,
  sidebarBorder: brand.stroke,
  sidebarRing: brand.primary,
  event: LATTE_EVENT,
  eventOnPrimary: MOCHA_EVENT,
} as const satisfies WebTheme;

/** Dark theme — structural mirror of `webLight` using `brandDark`. */
export const webDark = {
  background: brandDark.background,
  foreground: brandDark.text1,
  card: nativeDark.card,
  cardForeground: brandDark.text1,
  popover: nativeDark.navBar,
  popoverForeground: brandDark.text1,
  primary: brandDark.primary,
  primaryForeground: brand.text1,
  primaryLight: brandDark.primaryLight,
  secondary: brandDark.accent,
  secondaryForeground: brandDark.background,
  muted: brandDark.primaryLight,
  mutedForeground: brandDark.text2,
  accent: brandDark.primaryLight,
  accentForeground: brandDark.text1,
  destructive: brandDark.error,
  destructiveForeground: nativeDark.card,
  success: brandDark.success,
  pdf: PDF_DARK,
  border: brandDark.stroke,
  input: brandDark.stroke,
  ring: brandDark.primary,
  sidebar: nativeDark.navBar,
  sidebarForeground: brandDark.text1,
  sidebarPrimary: brandDark.primary,
  sidebarPrimaryForeground: brand.text1,
  sidebarAccent: brandDark.accent,
  sidebarAccentForeground: "#ffffff",
  sidebarActive: brandDark.text3,
  sidebarActiveForeground: brandDark.text1,
  sidebarBorder: brandDark.stroke,
  sidebarRing: brandDark.primary,
  event: MOCHA_EVENT,
  eventOnPrimary: LATTE_EVENT,
} as const satisfies WebTheme;

export const webPalette = {
  light: webLight,
  dark: webDark,
} as const;

/** PWA chrome colors aligned with the active theme background. */
export const themeColor = {
  light: brand.background,
  dark: brandDark.background,
} as const;

/** CSS custom-property names emitted into `tokens.css`. */
const WEB_CSS_KEYS = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "primaryLight",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "success",
  "pdf",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarPrimaryForeground",
  "sidebarAccent",
  "sidebarAccentForeground",
  "sidebarActive",
  "sidebarActiveForeground",
  "sidebarBorder",
  "sidebarRing",
] as const;

const WEB_TO_CSS: Record<(typeof WEB_CSS_KEYS)[number], string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  primaryLight: "--primary-light",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  success: "--success",
  pdf: "--pdf",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarActive: "--sidebar-active",
  sidebarActiveForeground: "--sidebar-active-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

function eventCssVars(
  prefix: "event" | "event-on-primary",
  colors: readonly string[],
): string {
  return colors
    .map(
      (color, index) => `    --${prefix}-${index + 1}: ${color.toLowerCase()};`,
    )
    .join("\n");
}

/** Builds the `:root` / `.dark` block for `tokens.css`. */
export function webThemeToCssBlock(
  theme: WebTheme,
  selector: ":root" | ".dark",
): string {
  const lines = WEB_CSS_KEYS.map((key) => {
    const cssKey = WEB_TO_CSS[key];
    const value = theme[key as keyof WebTheme] as string;
    return `    ${cssKey}: ${value.toLowerCase()};`;
  });

  lines.push(eventCssVars("event", theme.event));
  lines.push(eventCssVars("event-on-primary", theme.eventOnPrimary));

  return `${selector} {\n${lines.join("\n")}\n  }`;
}

export function generateTokensCss(): string {
  return `/* Generated by packages/design-tokens/scripts/generate-css.ts — do not edit. */
@layer tokens {
${webThemeToCssBlock(webLight, ":root")}

${webThemeToCssBlock(webDark, ".dark")}
}
`;
}
