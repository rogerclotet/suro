"use client";

import { Settings, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Note } from "@/app/_data/note";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import DeleteNoteModal from "./delete-note-modal";

export default function SettingsMenu({ note }: { note: Note }) {
  const t = useTranslations("notes");

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent>
        <DeleteNoteModal
          note={note}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              {t("deleteTitle")}
            </ResponsiveMenuItem>
          }
        />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
