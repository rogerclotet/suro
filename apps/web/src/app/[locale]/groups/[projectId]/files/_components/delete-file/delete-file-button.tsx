"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { File } from "@/app/_data/file";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";

export default function DeleteFileButton({ file }: { file: File }) {
  const { data: session } = useSession();
  const t = useTranslations("files");
  const tCommon = useTranslations("common");
  const deleteFile = useMutation(api.files.remove);

  async function handleDelete() {
    try {
      await deleteFile({ fileId: file.id as Id<"files"> });
      toast.success(t("deleteSuccess", { name: file.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_file",
        projectId: file.projectId,
        eventId: file.eventId,
        fileId: file.id,
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
      trigger={
        <button
          type="button"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      }
    />
  );
}
