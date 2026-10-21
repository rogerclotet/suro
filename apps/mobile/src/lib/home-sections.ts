import {
  Folder,
  Gift,
  type LucideIcon,
  NotebookText,
} from "lucide-react-native";

/**
 * Quick links on the home dashboard — one row of chips below the date header.
 * `key` is the notification section and `nav` label; `path` the route segment.
 */
export const HOME_SECTIONS = [
  { key: "files", path: "files", icon: Folder },
  { key: "notes", path: "notes", icon: NotebookText },
  { key: "secretSanta", path: "secret-santa", icon: Gift },
] as const satisfies readonly { key: string; path: string; icon: LucideIcon }[];
