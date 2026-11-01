import type { NavKey } from "@/i18n/message-keys";
import { routing } from "@/i18n/routing";

const GROUP = "/groups/[projectId]";
const HOME = `${GROUP}/home`;

export type GroupHeaderRoute =
  /** A bottom-bar section: Back leaves the group and the title names it. */
  | { kind: "tab" }
  /** Anything else in a group: Back goes one level up and the title says where. */
  | { kind: "nested"; parent: string; titleKey: NavKey | null };

const TITLE_KEYS: Record<string, NavKey> = {
  home: "home",
  lists: "lists",
  templates: "templates",
  calendar: "calendar",
  expenses: "expenses",
  files: "files",
  notes: "notes",
  "secret-santa": "secretSanta",
  ideas: "ideas",
  settings: "settings",
};

/**
 * How the mobile header presents a group route, from the canonical pathname
 * `usePathname()` returns. Sections Home opens (Files, Notes, Secret Santa)
 * and group settings go back to Home; deeper pages go back to their parent.
 */
export function groupHeaderRoute(
  pathname: string,
  tabSections: readonly string[],
): GroupHeaderRoute | null {
  if (!pathname.startsWith(`${GROUP}/`)) return null;
  const segments = pathname.slice(GROUP.length + 1).split("/");
  const [section] = segments;
  if (!section) return null;
  if (segments.length === 1 && tabSections.includes(section)) {
    return { kind: "tab" };
  }
  const up =
    segments.length === 1
      ? HOME
      : `${GROUP}/${segments.slice(0, -1).join("/")}`;
  const parent = up in routing.pathnames ? up : HOME;
  const named = [...segments]
    .reverse()
    .find((segment) => segment in TITLE_KEYS);
  return {
    kind: "nested",
    parent,
    titleKey: named ? (TITLE_KEYS[named] ?? null) : null,
  };
}
