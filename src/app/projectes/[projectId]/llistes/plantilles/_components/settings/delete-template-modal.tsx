"use client";

import type { Template } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { deleteTemplate } from "./actions";

export default function DeleteTemplateModal({
  template,
  triggerRef,
}: {
  template: Template;
  triggerRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();

  async function handleDelete() {
    try {
      await deleteTemplate(template);
      router.push(`/projectes/${template.projectId}/llistes/plantilles`);

      toast.success(`Plantilla ${template.name} eliminada`);
    } catch (e) {
      captureException(e);
      console.error(e);
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
