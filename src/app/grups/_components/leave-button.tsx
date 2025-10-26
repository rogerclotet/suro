"use client";

import { captureException } from "@sentry/nextjs";
import { LogOut } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLogger } from "next-axiom";
import React from "react";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { leaveProject } from "./actions";

export default function LeaveButton({ project }: { project: Project }) {
  const session = useSession();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const { projects, selectProject } = useProjects();
  const log = useLogger();

  async function handleLeave() {
    try {
      await leaveProject(project);
      const projectToSelect = projects.find((p) => p.id !== project.id);
      selectProject(projectToSelect);
      toast.success(`Has sortit del grup ${project.name}`);
    } catch (e) {
      captureException(e);
      log.error("Error leaving project", { error: e, projectId: project.id });
      toast.error("No s'ha pogut sortir del grup, torna-ho a provar més tard");
    }
  }

  if (
    project.users.length <= 1 ||
    project.createdBy === session.data?.user.id
  ) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => modalRef.current?.click()}
        aria-label="Sortir del grup"
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <LogOut />
      </Button>

      <ModalAction
        title="Sortir del grup"
        description={`Estàs segur que vols sortir del grup ${project.name}? Aquesta acció no es pot desfer.`}
        actionText="Sortir"
        onAction={handleLeave}
        variant="destructive"
        triggerRef={modalRef}
      />
    </>
  );
}
