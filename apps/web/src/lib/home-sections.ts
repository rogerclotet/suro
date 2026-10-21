import type { LucideIcon } from "lucide-react";
import { FileTextIcon, FolderOpen, GiftIcon } from "lucide-react";
import type { NavKey } from "@/i18n/message-keys";

/** Quick links on the home dashboard — one row of chips below the date header. */
export const HOME_SECTIONS = [
  { key: "files", path: "files", icon: FolderOpen },
  { key: "notes", path: "notes", icon: FileTextIcon },
  { key: "secretSanta", path: "secret-santa", icon: GiftIcon },
] as const satisfies readonly { key: NavKey; path: string; icon: LucideIcon }[];
