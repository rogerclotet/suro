"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";

export default function LeaveButton({ project }: { project: Project }) {
  const { data: session } = useSession();
  const { projects, selectProject } = useProjects();
  const t = useTranslations("groups");
  const leaveProject = useMutation(api.projects.leave);

  async function handleLeave() {
    try {
      await leaveProject({ projectId: project.id as Id<"projects"> });
      const projectToSelect = projects.find((p) => p.id !== project.id);
      selectProject(projectToSelect);
      toast.success(t("leaveSuccess", { name: project.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "leave_project",
        projectId: project.id,
      });
      toast.error(t("leaveError"));
    }
  }

  if (project.users.length <= 1 || project.createdBy === session?.user.id) {
    return null;
  }

  return (
    <ModalAction
      title={t("leaveConfirmTitle")}
      description={t("leaveConfirmDescription", { name: project.name })}
      actionText={t("leave")}
      onAction={handleLeave}
      variant="destructive"
      trigger={
        <Button variant="ghost" size="icon" aria-label={t("leaveConfirmTitle")}>
          <LogOut />
        </Button>
      }
    />
  );
}
