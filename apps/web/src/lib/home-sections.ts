import type { LucideIcon } from "lucide-react";
import { FileTextIcon, FolderOpen } from "lucide-react";

/** Quick links on the home dashboard — one row of chips below the date header. */
export const HOME_SECTIONS = [
  { key: "files", icon: FolderOpen },
  { key: "notes", icon: FileTextIcon },
] as const satisfies readonly { key: string; icon: LucideIcon }[];
