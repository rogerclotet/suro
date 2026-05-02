"use client";

import { CheckIcon, LayoutGridIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import ProjectAvatar from "@/components/project-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function GroupSwitcherSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects, project, selectProject } = useProjects();
  const router = useRouter();
  const pathname = usePathname();

  function handleProjectSelect(p: Project) {
    selectProject(p);
    onOpenChange(false);
    const currentSection = pathname
      .split(`/grups/${project?.id}/`)[1]
      ?.split("/")[0];
    const targetPath = currentSection
      ? `/grups/${p.id}/${currentSection}`
      : `/grups/${p.id}`;
    router.push(targetPath);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
        <SheetHeader className="mb-3.5 items-start px-0">
          <SheetTitle className="text-sm">Canvia de grup</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1">
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
                  <div className="truncate text-[15px] font-semibold">
                    {p.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.users.length === 1
                      ? "1 membre"
                      : `${p.users.length} membres`}
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
            router.push("/grups");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <LayoutGridIcon size={16} />
          Gestionar grups
        </button>
      </SheetContent>
    </Sheet>
  );
}
