"use client";

import { Edit, Import, ListX, Settings, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { List, Template } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleFavorite } from "./actions";
import ClearCompletedModal from "./clear-completed-modal";
import DeleteListModal from "./delete-list-modal";
import EditListForm from "./edit-list-form";
import ImportTemplatesModal from "./import-templates/import-templates-modal";

export default function SettingsMenu({
  list,
  templates,
}: {
  list: List;
  templates: Template[];
}) {
  const tLists = useTranslations("lists");
  const tTemplates = useTranslations("templates");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onSelect={() => toggleFavorite(list)}
        >
          <Star
            size={16}
            className={list.favorite ? "fill-yellow-400 text-yellow-400" : ""}
          />
          {list.favorite
            ? tLists("removeFromFavorites")
            : tLists("addToFavorites")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <ClearCompletedModal
          list={list}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <ListX /> {tLists("clearCompletedTitle")}
            </DropdownMenuItem>
          }
        />

        <ImportTemplatesModal
          list={list}
          templates={templates}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Import /> {tTemplates("importTitle")}
            </DropdownMenuItem>
          }
        />

        <EditListForm
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              {tLists("editTitle")}
            </DropdownMenuItem>
          }
          list={list}
        />

        <DeleteListModal
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              {tLists("deleteTitle")}
            </DropdownMenuItem>
          }
          list={list}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
