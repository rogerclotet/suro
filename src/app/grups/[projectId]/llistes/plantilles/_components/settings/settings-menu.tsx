"use client";

import { Edit, Settings, Trash2 } from "lucide-react";
import type { Template } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteTemplateModal from "./delete-template-modal";
import EditTemplateForm from "./edit-template-form";

export default function SettingsMenu({ template }: { template: Template }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <EditTemplateForm
          template={template}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              Editar plantilla
            </DropdownMenuItem>
          }
        />

        <DeleteTemplateModal
          template={template}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              Eliminar plantilla
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
