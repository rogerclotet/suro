"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { captureException } from "@/lib/error-reporting";

export default function DeletePotModal({
  pot,
  trigger,
}: {
  pot: { id: string; name: string; projectId: string };
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const deletePot = useMutation(api.expenses.deletePot);

  async function handleDelete() {
    try {
      await deletePot({ potId: pot.id as Id<"pots"> });
      router.push({
        pathname: "/groups/[projectId]/expenses",
        params: { projectId: pot.projectId },
      });
      toast.success(t("deletePotSuccess", { name: pot.name }));
    } catch (e) {
      captureException(e, { action: "delete_pot" });
      toast.error(t("deletePotError"));
    }
  }

  return (
    <ModalAction
      title={t("deletePotTitle")}
      description={t("deletePotDescription")}
      actionText={tCommon("delete")}
      onAction={handleDelete}
      variant="destructive"
      trigger={trigger}
    />
  );
}
