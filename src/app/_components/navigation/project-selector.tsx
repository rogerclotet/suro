"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import ProjectAvatar from "@/components/project-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProjectSelector() {
  const { projects, project, selectProject } = useProjects();
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: session } = useSession();

  function handleProjectSelect(newProject: Project) {
    selectProject(newProject);
    setOpenMobile(false);
    const currentSection = pathname
      .split(`/grups/${project?.id}/`)[1]
      ?.split("/")[0];
    const targetPath = currentSection
      ? `/grups/${newProject.id}/${currentSection}`
      : `/grups/${newProject.id}`;
    router.push(targetPath);
  }

  if (!project || projects.length === 0) {
    return (
      <Skeleton
        className={cn(
          "w-full",
          state === "expanded" ? "h-13" : "aspect-square rounded-full",
        )}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" tooltip={project.name}>
          <ProjectAvatar project={project} />
          <div className="flex flex-col">
            <span>{project.name}</span>
            <span className="text-muted-foreground text-xs">
              {project.users.length > 1
                ? `${project.users.length} membres`
                : session?.user.name}
            </span>
          </div>
          <ChevronsUpDownIcon className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
      >
        <DropdownMenuLabel>Grups</DropdownMenuLabel>

        <DropdownMenuSeparator />

        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => handleProjectSelect(p)}
            disabled={project.id === p.id}
            className={
              project.id === p.id
                ? "bg-secondary text-secondary-foreground"
                : ""
            }
          >
            <ProjectAvatar project={p} className="h-6 w-6 text-xs" />
            <span className="min-w-0 truncate">{p.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
