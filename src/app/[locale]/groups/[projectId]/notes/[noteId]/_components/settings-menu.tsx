"use client";

import { Edit, Settings, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Note } from "@/app/_data/note";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteNoteModal from "./delete-note-modal";
import EditNoteForm from "./edit-note-form";

export default function SettingsMenu({ note }: { note: Note }) {
  const t = useTranslations("notes");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <EditNoteForm
          note={note}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              {t("editTitle")}
            </DropdownMenuItem>
          }
        />

        <DeleteNoteModal
          note={note}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              {t("deleteTitle")}
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
