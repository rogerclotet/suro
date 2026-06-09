"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useSession } from "@/lib/session";
import { exportTemplate } from "./actions";

function ExportTemplateForm({ template }: { template: Template }) {
  const { projects } = useProjects();
  const { data: session } = useSession();
  const { close } = useModalForm();
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");

  const otherProjects = projects.filter((p) => p.id !== template.projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetProjectId) return;

    setIsSubmitting(true);
    try {
      await exportTemplate(template, targetProjectId);
      const targetProject = projects.find((p) => p.id === targetProjectId);
      toast.success(
        t("exportSuccess", {
          target: targetProject?.name ?? targetProjectId,
        }),
      );
      close();
    } catch (err) {
      posthog.captureException(err, {
        distinctId: session?.user.id,
        action: "export_template",
        templateId: template.id,
        targetProjectId,
      });
      toast.error(t("exportError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Select value={targetProjectId} onValueChange={setTargetProjectId}>
        <SelectTrigger>
          <SelectValue placeholder={tCommon("selectGroup")} />
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
        {isSubmitting ? t("exporting") : t("export")}
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
  const t = useTranslations("templates");

  return (
    <ModalForm
      trigger={trigger}
      title={t("exportTitle")}
      description={t("exportDescription")}
    >
      <ExportTemplateForm template={template} />
    </ModalForm>
  );
}
