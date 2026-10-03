"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { captureException } from "@/lib/error-reporting";

export default function DeleteListModal({
  list,
  trigger,
}: {
  list: List;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("lists");
  const tCommon = useTranslations("common");
  const deleteList = useMutation(api.lists.remove);

  async function handleDelete() {
    try {
      await deleteList({ listId: list.id as Id<"lists"> });
      router.push({
        pathname: "/groups/[projectId]/lists",
        params: { projectId: list.projectId },
      });

      toast.success(t("deleteSuccess", { name: list.name }));
    } catch (e) {
      captureException(e, { action: "delete_list" });
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
