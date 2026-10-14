/**
 * URL helpers for sharing and the calendar feed. `EXPO_PUBLIC_*` vars are
 * inlined at build time (same pattern as src/lib/convex.ts).
 */

/**
 * Used when a build sets no `EXPO_PUBLIC_SITE_URL`. Any host shared from here
 * must also be registered for app links in app.json (scripts/app-links.test.ts).
 */
export const DEFAULT_SITE_URL = "https://suroapp.cat";

/** Absolute link into the production web app for a given path. */
export function webUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * The Convex HTTP-actions origin for this deployment. Convex serves httpRouter
 * routes on `<deployment>.convex.site` (the `.convex.cloud` API host with the
 * suffix swapped).
 */
export function convexSiteUrl(): string {
  return (process.env.EXPO_PUBLIC_CONVEX_URL ?? "").replace(
    /\.convex\.cloud$/,
    ".convex.site",
  );
}

/** Branded calendar feed URL on our own domain (proxied to Convex by the web app). */
export function calendarFeedUrl(projectId: string, token: string): string {
  return webUrl(`/calendar.ics?projectId=${projectId}&token=${token}`);
}
