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

const LOCALIZED_SEGMENTS: Record<string, Partial<Record<Locale, string>>> = {
  groups: { ca: "grups", es: "grupos" },
  lists: { ca: "llistes", es: "listas" },
  templates: { ca: "plantilles", es: "plantillas" },
  calendar: { ca: "calendari", es: "calendario" },
  files: { ca: "fitxers", es: "archivos" },
  notes: { es: "notas" },
  edit: { ca: "edita", es: "editar" },
  expenses: { ca: "despeses", es: "gastos" },
  invitation: { ca: "invitacio", es: "invitacion" },
  "secret-santa": { ca: "amic-invisible", es: "amigo-invisible" },
};

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

export const isLocale = (segment: string): segment is Locale =>
  LOCALE_SET.has(segment);

export const toCanonicalSegment = (segment: string): string =>
  CANONICAL_SEGMENTS[segment] ?? segment;

export function localizeGroupPath(path: string, locale: string): string {
  const target = normalizeLocale(locale);
  const localized = path
    .split("/")
    .filter(Boolean)
    .map((segment) => LOCALIZED_SEGMENTS[segment]?.[target] ?? segment);
  return `/${[target, ...localized].join("/")}`;
}

const MOBILE_FEATURES = new Set([
  "lists",
  "calendar",
  "files",
  "notes",
  "expenses",
]);

// Features that live behind the Home tab rather than getting their own bottom
// tab, so their in-app route is nested one level deeper (`/<pid>/home/<feature>`).
// expo-router's NativeTabs only ever navigates to routes declared as a
// `<Trigger>` in [projectId]/_layout.tsx — a sibling route like `/<pid>/files`
// isn't part of the tab navigator's route table and silently fails to open.
// Nesting the screen under the Home tab's own stack (and rewriting the
// canonical path here) makes it reachable. Keep in sync with the routes under
// [projectId]/home/ and HOME_SECTIONS in lib/home-sections.ts.
const HOME_TAB_FEATURES = new Set(["files", "notes"]);

/**
 * Rewrite a canonical in-app group route so Home-tab sections carry their
 * `home/` prefix: `/<pid>/notes/<x>` → `/<pid>/home/notes/<x>`. Other sections
 * and non-section paths pass through unchanged. The single source of truth for
 * this nesting — shared by the universal-link resolver below and the
 * push-notification tap handler (lib/push.ts), whose payloads are built
 * server-side without knowledge of the mobile tab layout.
 */
export function withHomeTabPrefix(route: string): string {
  const segments = route.split("/").filter(Boolean); // [projectId, feature, ...]
  const feature = segments[1];
  if (!feature || !HOME_TAB_FEATURES.has(feature)) {
    return route;
  }
  segments.splice(1, 0, "home");
  return `/${segments.join("/")}`;
}

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
    pathname = new URL(path, "https://suro.clotet.dev").pathname;
  } catch {
    return path;
  }

  const segments = pathname.split("/").filter(Boolean);

  const first = segments[0];
  const rooted = first && isLocale(first) ? segments.slice(1) : segments;

  const [root, projectId, feature, ...rest] = rooted;
  if (!root || toCanonicalSegment(root) !== "groups" || !projectId) {
    return path;
  }

  if (feature && toCanonicalSegment(feature) === "invitation") {
    const token = rest[0];
    return token ? `/invitation/${projectId}/${token}` : path;
  }

  const mappedFeature = feature ? toCanonicalSegment(feature) : undefined;
  if (!mappedFeature || !MOBILE_FEATURES.has(mappedFeature)) {
    return `/${projectId}/home`;
  }

  const tail = rest.map(toCanonicalSegment).join("/");
  const route = tail
    ? `/${projectId}/${mappedFeature}/${tail}`
    : `/${projectId}/${mappedFeature}`;
  return withHomeTabPrefix(route);
}
