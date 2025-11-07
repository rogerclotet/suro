import { Edit, Import, ListX, Settings, Trash2 } from "lucide-react";
import type { List, Template } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <ClearCompletedModal
          list={list}
          trigger={
            <DropdownMenuItem className="cursor-pointer gap-2">
              <ListX /> Esborrar completats
            </DropdownMenuItem>
          }
        />

        <ImportTemplatesModal
          list={list}
          templates={templates}
          trigger={
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Import /> Importar plantilles
            </DropdownMenuItem>
          }
        />

        <EditListForm
          trigger={
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Edit />
              Editar llista
            </DropdownMenuItem>
          }
          list={list}
        />

        <DeleteListModal
          trigger={
            <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground">
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
