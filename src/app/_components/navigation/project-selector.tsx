"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import { useFlags } from "@/app/_state/flags-state";
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
import { usePathname, useRouter } from "@/i18n/navigation";
import { resolveSectionForProject } from "./use-menu-items";

export default function ProjectSelector() {
  const { projects, project, selectProject } = useProjects();
  const { flags } = useFlags();
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { data: session } = useSession();
  const tNav = useTranslations("nav");
  const tGroups = useTranslations("groups");

  function handleProjectSelect(newProject: Project) {
    selectProject(newProject);
    setOpenMobile(false);
    // pathname is the canonical template, e.g. "/groups/[projectId]/lists"
    const currentSection = pathname
      .split("/groups/[projectId]/")[1]
      ?.split("/")[0];
    const targetSection = resolveSectionForProject(
      newProject,
      flags,
      currentSection,
    );
    router.push(`/groups/${newProject.id}/${targetSection}` as never);
  }

  if (!project || projects.length === 0) {
    if (state !== "expanded") {
      return <Skeleton className="size-8 rounded-full" />;
    }
    return (
      <div className="flex w-full items-center gap-2 overflow-hidden rounded-md p-4 md:p-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
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
                ? tGroups("memberCount", { count: project.users.length })
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
        <DropdownMenuLabel>{tNav("groups")}</DropdownMenuLabel>

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
