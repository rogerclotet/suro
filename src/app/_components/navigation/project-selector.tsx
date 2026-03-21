"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: session } = useSession();

  function handleProjectSelect(project: Project) {
    selectProject(project);
    setOpenMobile(false);
    router.push(`/grups/${project.id}`);
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
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {project?.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {p.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 truncate">{p.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
