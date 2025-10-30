"use client";

import { Edit, Import, ListX, Settings, Trash2 } from "lucide-react";
import React from "react";
import type { List, Template } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ModalForm from "@/components/ui/modal-form";
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
  const clearCompletedDialogRef = React.useRef<HTMLDivElement>(null);
  const importDialogRef = React.useRef<HTMLDivElement>(null);
  const editDialogRef = React.useRef<HTMLDivElement>(null);
  const deleteDialogRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => clearCompletedDialogRef.current?.click()}
            className="cursor-pointer gap-2"
          >
            <ListX /> Esborrar completats
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => importDialogRef.current?.click()}
            className="cursor-pointer gap-2"
          >
            <Import /> Importar plantilles
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editDialogRef.current?.click()}
            className="cursor-pointer gap-2"
          >
            <Edit />
            Editar llista
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => deleteDialogRef.current?.click()}
            className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 />
            Eliminar llista
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ClearCompletedModal list={list} triggerRef={clearCompletedDialogRef} />
      <ImportTemplatesModal
        list={list}
        templates={templates}
        triggerRef={importDialogRef}
      />
      <ModalForm
        triggerRef={editDialogRef}
        title="Editar llista"
        description="Editar el títol i la descripció de la llista"
      >
        <EditListForm
          list={list}
          onClose={() => editDialogRef.current?.click()}
        />
      </ModalForm>
      <DeleteListModal triggerRef={deleteDialogRef} list={list} />
    </>
  );
}
