"use client";

import { Copy, Edit, Settings, Trash2 } from "lucide-react";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import DeleteTemplateModal from "./delete-template-modal";
import EditTemplateForm from "./edit-template-form";
import ExportTemplateModal from "./export-template-modal";

export default function SettingsMenu({ template }: { template: Template }) {
  const { projects } = useProjects();
  const hasOtherProjects = projects.some((p) => p.id !== template.projectId);

  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent>
        <EditTemplateForm
          template={template}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              Editar plantilla
            </ResponsiveMenuItem>
          }
        />

        {hasOtherProjects && (
          <ExportTemplateModal
            template={template}
            trigger={
              <ResponsiveMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer gap-2"
              >
                <Copy />
                Exportar a un altre grup
              </ResponsiveMenuItem>
            }
          />
        )}

        <DeleteTemplateModal
          template={template}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              Eliminar plantilla
            </ResponsiveMenuItem>
          }
        />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
