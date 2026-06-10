/**
 * Translation between the web app's localized group URLs and the mobile app's
 * routes. The segment names mirror apps/web/src/i18n/routing.ts. Single source
 * of truth for the two directions we need:
 *   - app/+native-intent.tsx resolves an incoming universal link to an in-app
 *     route (localized web segment -> canonical mobile segment);
 *   - the share buttons build a localized web URL to share (canonical segment
 *     -> localized, prefixed with the sharer's locale).
 *
 * Relative imports on purpose: this module is exercised by Vitest, which has no
 * "@/" path-alias plugin configured.
 */
import { LOCALES, type Locale, normalizeLocale } from "../i18n/config";

// Canonical (English, == mobile route) group-path segment -> its localized form
// per locale. Segments absent here — IDs, tokens, and segments spelled the same
// as English in a locale (e.g. "categories"/"notes" in Catalan) — pass through.
const LOCALIZED_SEGMENTS: Record<string, Partial<Record<Locale, string>>> = {
  groups: { ca: "grups", es: "grupos" },
  lists: { ca: "llistes", es: "listas" },
  templates: { ca: "plantilles", es: "plantillas" },
  calendar: { ca: "calendari", es: "calendario" },
  files: { ca: "fitxers", es: "archivos" },
  notes: { es: "notas" },
  expenses: { ca: "despeses", es: "gastos" },
  invitation: { ca: "invitacio", es: "invitacion" },
  "secret-santa": { ca: "amic-invisible", es: "amigo-invisible" },
};

// Reverse index (localized segment -> canonical), built once from the map above.
const CANONICAL_SEGMENTS: Record<string, string> = {};
for (const [canonicalSegment, localized] of Object.entries(
  LOCALIZED_SEGMENTS,
)) {
  for (const localizedSegment of Object.values(localized)) {
    if (typeof localizedSegment === "string") {
      CANONICAL_SEGMENTS[localizedSegment] = canonicalSegment;
    }
  }
}

const LOCALE_SET: ReadonlySet<string> = new Set(LOCALES);

/** Whether a path segment is one of the supported locale prefixes. */
export const isLocale = (segment: string): segment is Locale =>
  LOCALE_SET.has(segment);

/** Map a localized path segment back to its canonical (mobile-route) form. */
export const toCanonicalSegment = (segment: string): string =>
  CANONICAL_SEGMENTS[segment] ?? segment;

/**
 * Localize a canonical group path (e.g. `/groups/<id>/invitation/<token>`) into
 * a locale-prefixed, localized web path (`/ca/grups/<id>/invitacio/<token>`) for
 * sharing — more readable, and group recipients usually share the sharer's
 * language. IDs and segments with no localized form pass through unchanged.
 */
export function localizeGroupPath(path: string, locale: string): string {
  const target = normalizeLocale(locale);
  const localized = path
    .split("/")
    .filter(Boolean)
    .map((segment) => LOCALIZED_SEGMENTS[segment]?.[target] ?? segment);
  return `/${[target, ...localized].join("/")}`;
}

// In-app tab features under /[projectId]. A group link to anything else (no
// feature, or one with no native screen like secret-santa) opens the home tab.
const MOBILE_FEATURES = new Set([
  "lists",
  "calendar",
  "files",
  "notes",
  "expenses",
]);

/**
 * Resolve an incoming Universal Link / App Link web path to the matching in-app
 * route. The web URL reaches the router without its origin, e.g.
 * `/ca/grups/<id>/llistes/<listId>` or the canonical `/groups/<id>/lists/<listId>`;
 * both map to `/<id>/lists/<listId>` (the (app) route group is invisible to
 * URLs). Invites map to `/invitation/<id>/<token>`, whose screen lives outside
 * (app). Anything that isn't a group web path — existing suro://invitation/...
 * scheme links, the OAuth callback, push-notification targets — is returned
 * unchanged so it routes exactly as before.
 */
export function webPathToRoute(path: string): string {
  let pathname: string;
  try {
    // Resolves bare paths against the base; absolute URLs ignore it.
    pathname = new URL(path, "https://suro.clotet.dev").pathname;
  } catch {
    return path;
  }

  const segments = pathname.split("/").filter(Boolean);

  // Web links carry a locale prefix; app-shared canonical links don't.
  const first = segments[0];
  const rooted = first && isLocale(first) ? segments.slice(1) : segments;

  const [root, projectId, feature, ...rest] = rooted;
  if (!root || toCanonicalSegment(root) !== "groups" || !projectId) {
    return path;
  }

  // Invites live on their own screen outside the (app) auth group.
  if (feature && toCanonicalSegment(feature) === "invitation") {
    const token = rest[0];
    return token ? `/invitation/${projectId}/${token}` : path;
  }

  // No feature, or one with no native screen (e.g. secret-santa): open the
  // group's home tab rather than a dead route.
  const mappedFeature = feature ? toCanonicalSegment(feature) : undefined;
  if (!mappedFeature || !MOBILE_FEATURES.has(mappedFeature)) {
    return `/${projectId}/lists`;
  }

  const tail = rest.map(toCanonicalSegment).join("/");
  return tail
    ? `/${projectId}/${mappedFeature}/${tail}`
    : `/${projectId}/${mappedFeature}`;
}
