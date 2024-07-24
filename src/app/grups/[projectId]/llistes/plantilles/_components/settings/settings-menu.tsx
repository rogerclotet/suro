"use client";

import type { Template } from "@/app/_data/list";
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
import DeleteTemplateModal from "./delete-template-modal";
import EditTemplateForm from "./edit-template-form";

export default function SettingsMenu({ template }: { template: Template }) {
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
            onClick={() => editDialogRef.current?.click()}
            className="cursor-pointer gap-2"
          >
            <Edit />
            Editar plantilla
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => deleteDialogRef.current?.click()}
            className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 />
            Eliminar plantilla
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ModalForm
        triggerRef={editDialogRef}
        title="Editar plantilla"
        description="Editar el nom i la descripció de la plantilla"
      >
        <EditTemplateForm
          template={template}
          onClose={() => editDialogRef.current?.click()}
        />
      </ModalForm>
      <DeleteTemplateModal template={template} triggerRef={deleteDialogRef} />
    </>
  );
}
