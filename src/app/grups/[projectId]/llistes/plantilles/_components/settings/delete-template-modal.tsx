"use client";

import { captureException } from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { useLogger } from "next-axiom";
import type React from "react";
import { toast } from "sonner";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import ModalAction from "@/components/ui/modal-action";
import { deleteTemplate } from "./actions";

export default function DeleteTemplateModal({
  template,
  triggerRef,
}: {
  template: Template;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();
  const { project } = useProjects();
  const log = useLogger();

  async function handleDelete() {
    try {
      await deleteTemplate(template);
      router.push(`/grups/${template.projectId}/llistes/plantilles`);

      toast.success(`Plantilla ${template.name} eliminada`);
    } catch (e) {
      captureException(e);
      log.error("Error deleting template", {
        error: e,
        projectId: project?.id,
        templateId: template.id,
      });
      toast.error(
        "No s'ha pogut eliminar la plantilla, torna-ho a provar més tard",
      );
    }
  }

  return (
    <ModalAction
      title="Eliminar plantilla"
      description="Segur que vols eliminar la plantilla? Aquesta acció no es pot desfer."
      actionText="Eliminar"
      onAction={handleDelete}
      variant="destructive"
      triggerRef={triggerRef}
    />
  );
}
