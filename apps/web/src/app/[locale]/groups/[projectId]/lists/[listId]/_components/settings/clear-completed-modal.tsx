"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import ModalAction from "@/components/ui/modal-action";
import { captureException } from "@/lib/error-reporting";

export default function ClearCompletedModal({
  list,
  trigger,
}: {
  list: List;
  trigger: ReactNode;
}) {
  const t = useTranslations("lists");
  const clearCompleted = useMutation(api.lists.clearCompleted);

  async function handleClear() {
    try {
      await clearCompleted({ listId: list.id as Id<"lists"> });
      toast.success(t("clearCompletedSuccess"));
    } catch (e) {
      captureException(e, { action: "clear_completed_items" });
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
