"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { Template } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { captureException } from "@/lib/error-reporting";

export default function DeleteTemplateModal({
  template,
  trigger,
}: {
  template: Template;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const deleteTemplate = useMutation(api.templates.remove);

  async function handleDelete() {
    try {
      await deleteTemplate({ templateId: template.id as Id<"listTemplates"> });
      router.push({
        pathname: "/groups/[projectId]/lists/templates",
        params: { projectId: template.projectId },
      });

      toast.success(t("deleteSuccess", { name: template.name }));
    } catch (e) {
      captureException(e, { action: "delete_template" });
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
