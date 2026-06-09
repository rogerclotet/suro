"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import { deleteList } from "./actions";

export default function DeleteListModal({
  list,
  trigger,
}: {
  list: List;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("lists");
  const tCommon = useTranslations("common");

  async function handleDelete() {
    try {
      await deleteList(list);
      router.push({
        pathname: "/groups/[projectId]/lists",
        params: { projectId: list.projectId },
      });

      toast.success(t("deleteSuccess", { name: list.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_list",
        projectId: list.projectId,
        listId: list.id,
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
