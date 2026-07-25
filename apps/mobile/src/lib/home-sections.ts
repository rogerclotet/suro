import { Folder, type LucideIcon, NotebookText } from "lucide-react-native";

/** Quick links on the home dashboard — one row of chips below the date header. */
export const HOME_SECTIONS = [
  { key: "files", icon: Folder },
  { key: "notes", icon: NotebookText },
] as const satisfies readonly { key: string; icon: LucideIcon }[];
