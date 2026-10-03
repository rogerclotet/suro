"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Note } from "@/app/_data/note";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { captureException } from "@/lib/error-reporting";

export default function DeleteNoteModal({
  note,
  trigger,
}: {
  note: Note;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");
  const deleteNote = useMutation(api.notes.remove);

  async function handleDelete() {
    try {
      await deleteNote({ noteId: note.id as Id<"notes"> });
      router.push({
        pathname: "/groups/[projectId]/notes",
        params: { projectId: note.projectId },
      });
      toast.success(t("deleteSuccess", { name: note.name }));
    } catch (e) {
      captureException(e, { action: "delete_note" });
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
