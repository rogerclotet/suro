"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Note } from "@/app/_data/note";
import ModalAction from "@/components/ui/modal-action";
import { useRouter } from "@/i18n/navigation";
import { deleteNoteOffline } from "@/lib/offline/offline-notes";
import { useSession } from "@/lib/session";

export default function DeleteNoteModal({
  note,
  trigger,
}: {
  note: Note;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");

  async function handleDelete() {
    try {
      await deleteNoteOffline(note);
      router.push({
        pathname: "/groups/[projectId]/notes",
        params: { projectId: note.projectId },
      });
      toast.success(t("deleteSuccess", { name: note.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_note",
        projectId: note.projectId,
        noteId: note.id,
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
