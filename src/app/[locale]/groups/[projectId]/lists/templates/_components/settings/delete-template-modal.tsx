"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { deleteTemplate } from "./actions";

export default function DeleteTemplateModal({
  template,
  trigger,
}: {
  template: Template;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");

  async function handleDelete() {
    try {
      await deleteTemplate(template);
      router.push({
        pathname: "/groups/[projectId]/lists/templates",
        params: { projectId: template.projectId },
      });

      toast.success(t("deleteSuccess", { name: template.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_template",
        projectId: project?.id,
        templateId: template.id,
      });
      toast.error(t("deleteError"));
    }
  }

  return (
    <ModalAction
      title={t("deleteTitle")}
      description={t("deleteDescription")}
      actionText={tCommon("delete")}
      onAction={handleDelete}
      variant="destructive"
      trigger={trigger}
    />
  );
}
