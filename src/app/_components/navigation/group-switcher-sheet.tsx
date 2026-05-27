"use client";

import { CheckIcon, LayoutGridIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import { useFlags } from "@/app/_state/flags-state";
import { useProjects } from "@/app/_state/project-state";
import ProjectAvatar from "@/components/project-avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { resolveSectionForProject } from "./use-menu-items";

export default function GroupSwitcherSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects, project, selectProject } = useProjects();
  const { flags } = useFlags();
  const router = useRouter();
  const pathname = usePathname();
  const tGroups = useTranslations("groups");
  const tNav = useTranslations("nav");

  function handleProjectSelect(p: Project) {
    selectProject(p);
    onOpenChange(false);
    // pathname is the canonical template, e.g. "/groups/[projectId]/lists"
    const currentSection = pathname
      .split("/groups/[projectId]/")[1]
      ?.split("/")[0];
    const targetSection = resolveSectionForProject(p, flags, currentSection);
    router.push(`/groups/${p.id}/${targetSection}` as never);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85dvh] flex-col px-4 pb-6">
        <DrawerHeader className="mb-3.5 shrink-0 items-start px-0 pb-0">
          <DrawerTitle className="text-sm">
            {tGroups("switchGroup")}
          </DrawerTitle>
        </DrawerHeader>

        <div
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          data-vaul-no-drag
        >
          {projects.map((p) => {
            const isActive = p.id === project?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProjectSelect(p)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left transition-colors",
                  isActive ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <ProjectAvatar project={p} className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-[15px]">
                    {p.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {tGroups("memberCount", { count: p.users.length })}
                  </div>
                </div>
                {isActive && (
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            router.push("/groups");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-border py-3 text-muted-foreground text-sm transition-colors hover:bg-accent"
        >
          <LayoutGridIcon size={16} />
          {tNav("manageGroups")}
        </button>
      </DrawerContent>
    </Drawer>
  );
}
