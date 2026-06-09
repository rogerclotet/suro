"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const { projects, selectProject } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const removeProject = useMutation(api.projects.remove);

  const projectToDelete = projects.find((project) => project.id === projectId);
  if (!projectToDelete) {
    return null;
  }

  async function handleDelete() {
    if (!projectToDelete) {
      return;
    }

    try {
      await removeProject({ projectId: projectId as Id<"projects"> });
      const firstNonDeletedProject = projects.find(
        (project) => project.id !== projectId,
      );
      selectProject(firstNonDeletedProject);
      toast.success(t("deleteSuccess", { name: projectToDelete.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_project",
        projectId,
      });
      toast.error(t("deleteError"));
    }
  }

  return (
    <ModalAction
      title={t("deleteConfirmTitle")}
      description={t("deleteConfirmDescription", {
        name: projectToDelete.name,
      })}
      actionText={tCommon("delete")}
      onAction={handleDelete}
      variant="destructive"
      trigger={
        <Button
          variant="ghostDestructive"
          size="icon"
          aria-label={tCommon("delete")}
        >
          <Trash2 />
        </Button>
      }
    />
  );
}
