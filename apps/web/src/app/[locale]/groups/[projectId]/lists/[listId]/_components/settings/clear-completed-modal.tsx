"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";
import { clearCompletedItems } from "./actions";

export default function ClearCompletedModal({
  list,
  trigger,
}: {
  list: List;
  trigger: ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("lists");

  async function handleClear() {
    try {
      await clearCompletedItems(list);
      toast.success(t("clearCompletedSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "clear_completed_items",
        projectId: list.projectId,
        listId: list.id,
      });
      toast.error(t("clearCompletedError"));
    }
  }

  return (
    <ModalAction
      title={t("clearCompletedTitle")}
      description={t("clearCompletedDescription")}
      actionText={t("clearCompletedAction")}
      onAction={handleClear}
      variant="destructive"
      trigger={trigger}
    />
  );
}
