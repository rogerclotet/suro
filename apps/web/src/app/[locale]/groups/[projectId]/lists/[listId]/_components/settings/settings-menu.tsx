"use client";

import { Edit, Import, ListX, Settings, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { List, Template } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
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
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent>
        <ResponsiveMenuItem
          className="cursor-pointer gap-2"
          onClick={() => toggleFavorite(list)}
        >
          <Star
            size={16}
            className={list.favorite ? "fill-yellow-400 text-yellow-400" : ""}
          />
          {list.favorite
            ? tLists("removeFromFavorites")
            : tLists("addToFavorites")}
        </ResponsiveMenuItem>

        <ResponsiveMenuSeparator />

        <ClearCompletedModal
          list={list}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <ListX /> {tLists("clearCompletedTitle")}
            </ResponsiveMenuItem>
          }
        />

        <ImportTemplatesModal
          list={list}
          templates={templates}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Import /> {tTemplates("importTitle")}
            </ResponsiveMenuItem>
          }
        />

        <EditListForm
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              {tLists("editTitle")}
            </ResponsiveMenuItem>
          }
          list={list}
        />

        <DeleteListModal
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              {tLists("deleteTitle")}
            </ResponsiveMenuItem>
          }
          list={list}
        />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
