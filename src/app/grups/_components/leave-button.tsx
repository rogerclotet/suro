"use client";

import { LogOut } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { leaveProject } from "./actions";

export default function LeaveButton({ project }: { project: Project }) {
  const { data: session } = useSession();
  const { projects, selectProject } = useProjects();

  async function handleLeave() {
    try {
      await leaveProject(project);
      const projectToSelect = projects.find((p) => p.id !== project.id);
      selectProject(projectToSelect);
      toast.success(`Has sortit del grup ${project.name}`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "leave_project",
        projectId: project.id,
      });
      toast.error("No s'ha pogut sortir del grup, torna-ho a provar més tard");
    }
  }

  if (project.users.length <= 1 || project.createdBy === session?.user.id) {
    return null;
  }

  return (
    <ModalAction
      title="Sortir del grup"
      description={`Estàs segur que vols sortir del grup ${project.name}? Aquesta acció no es pot desfer.`}
      actionText="Sortir"
      onAction={handleLeave}
      variant="destructive"
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sortir del grup"
          className="hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut />
        </Button>
      }
    />
  );
}
