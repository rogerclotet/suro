"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";

export default function DeleteProjectButton({
  projectId,
  showLabel = false,
}: {
  projectId: string;
  showLabel?: boolean;
}) {
  const { projects } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("groups");
  const project = projects.find((p) => p.id === projectId);
  if (!project || project.createdBy !== session?.user.id) return null;
  return (
    <ModalForm
      title={t("deleteConfirmTitle")}
      description={t("deleteDataWarning")}
      trigger={
        <Button
          variant="ghostDestructive"
          size={showLabel ? "default" : "icon"}
          aria-label={t("deleteConfirmTitle")}
        >
          <Trash2 />
          {showLabel ? t("deleteConfirmTitle") : null}
        </Button>
      }
    >
      <DeleteGroupForm project={project} />
    </ModalForm>
  );
}

function DeleteGroupForm({ project }: { project: Project }) {
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const inputId = useId();
  const [confirmationName, setConfirmationName] = useState("");
  const [busy, setBusy] = useState(false);
  const remove = useMutation(api.projects.remove);
  const router = useRouter();
  const { close } = useModalForm();
  async function submit() {
    if (busy || confirmationName !== project.name) return;
    setBusy(true);
    try {
      await remove({
        projectId: project.id as Id<"projects">,
        confirmationName,
      });
      close();
      router.replace("/groups");
      toast.success(t("deleteSuccess", { name: project.name }));
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={inputId}>{t("deleteNameLabel")}</Label>
        <p
          id={`${inputId}-hint`}
          className="break-words text-muted-foreground text-sm"
        >
          {t("deleteNameInstruction", { name: project.name })}
        </p>
        <Input
          id={inputId}
          aria-describedby={`${inputId}-hint`}
          value={confirmationName}
          onChange={(event) => setConfirmationName(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={busy}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={close} disabled={busy}>
          {tc("cancel")}
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={busy || confirmationName !== project.name}
        >
          {busy ? t("working") : t("deleteConfirmTitle")}
        </Button>
      </div>
    </form>
  );
}
