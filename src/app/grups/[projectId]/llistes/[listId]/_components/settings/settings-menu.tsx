"use client";

import { Edit, Import, ListX, Settings, Star, Trash2 } from "lucide-react";
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
          {list.favorite ? "Treure de preferides" : "Afegir a preferides"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <ClearCompletedModal
          list={list}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <ListX /> Esborrar completats
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
              <Import /> Importar plantilles
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
              Editar llista
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
              Eliminar llista
            </DropdownMenuItem>
          }
          list={list}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
