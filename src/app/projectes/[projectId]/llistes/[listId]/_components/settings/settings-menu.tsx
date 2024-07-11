"use client";

import type { List } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ModalForm from "@/components/ui/modal-form";
import { Edit, Settings, Trash2 } from "lucide-react";
import React from "react";
import DeleteListModal from "./delete-list-form";
import EditListForm from "./edit-list-form";

export default function SettingsMenu({ list }: { list: List }) {
  const deleteDialogRef = React.useRef<HTMLDivElement>(null);
  const editDialogRef = React.useRef<HTMLDivElement>(null);

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

      <ModalForm triggerRef={editDialogRef} title="Editar llista">
        <EditListForm
          list={list}
          onClose={() => editDialogRef.current?.click()}
        />
      </ModalForm>
      <DeleteListModal triggerRef={deleteDialogRef} list={list} />
    </>
  );
}
