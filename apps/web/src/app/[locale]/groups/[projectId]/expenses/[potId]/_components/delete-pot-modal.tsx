"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";

export default function DeletePotModal({
  pot,
  trigger,
}: {
  pot: { id: string; name: string; projectId: string };
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
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
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_pot",
        projectId: pot.projectId,
      });
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
