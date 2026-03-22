"use client";

import { Copy } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportTemplate } from "./actions";

function ExportTemplateForm({ template }: { template: Template }) {
  const { projects } = useProjects();
  const { data: session } = useSession();
  const { close } = useModalForm();
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherProjects = projects.filter((p) => p.id !== template.projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetProjectId) return;

    setIsSubmitting(true);
    try {
      await exportTemplate(template, targetProjectId);
      const targetProject = projects.find((p) => p.id === targetProjectId);
      toast.success(
        `Plantilla exportada a "${targetProject?.name ?? targetProjectId}"`,
      );
      close();
    } catch (err) {
      posthog.captureException(err, {
        distinctId: session?.user.id,
        action: "export_template",
        templateId: template.id,
        targetProjectId,
      });
      toast.error(
        "No s'ha pogut exportar la plantilla, torna-ho a provar més tard",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Select value={targetProjectId} onValueChange={setTargetProjectId}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un grup" />
        </SelectTrigger>
        <SelectContent>
          {otherProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="submit"
        disabled={!targetProjectId || isSubmitting}
        className="w-full"
      >
        <Copy />
        {isSubmitting ? "Exportant..." : "Exportar"}
      </Button>
    </form>
  );
}

export default function ExportTemplateModal({
  template,
  trigger,
}: {
  template: Template;
  trigger: ReactNode;
}) {
  return (
    <ModalForm
      trigger={trigger}
      title="Exportar plantilla"
      description="Copia aquesta plantilla a un altre grup"
    >
      <ExportTemplateForm template={template} />
    </ModalForm>
  );
}
