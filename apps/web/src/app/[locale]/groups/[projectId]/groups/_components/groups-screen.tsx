"use client";

import {
  CheckIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  MessageSquarePlusIcon,
  PlusIcon,
  Settings2Icon,
  SettingsIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import { useFeedback } from "@/app/_state/feedback-state";
import { useProjects } from "@/app/_state/project-state";
import CreateProjectForm from "@/app/[locale]/groups/_components/create-project/create-project-form";
import ProjectAvatar from "@/components/project-avatar";
import UserAvatar from "@/components/user-avatar";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Full-screen group switcher plus account utilities (feedback, profile, changelog).
 * Selecting a group opens its home tab.
 */
export default function GroupsScreen() {
  const { projects, project, selectProject } = useProjects();
  const router = useRouter();
  const { openFeedback } = useFeedback();
  const { data: session } = useSession();
  const tGroups = useTranslations("groups");
  const tNav = useTranslations("nav");
  const tChangelog = useTranslations("changelog");

  function handleProjectSelect(p: Project) {
    selectProject(p);
    if (p.id === project?.id) {
      return;
    }
    router.push(`/groups/${p.id}/home` as never);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 py-2">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        {projects.map((p, index) => {
          const isActive = p.id === project?.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center px-4",
                index > 0 && "border-border border-t",
              )}
            >
              <button
                type="button"
                onClick={() => handleProjectSelect(p)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left transition-opacity hover:opacity-80",
                  isActive && "text-primary",
                )}
              >
                <ProjectAvatar
                  project={p}
                  className="h-[38px] w-[38px] text-sm"
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    isActive ? "font-bold" : "font-normal",
                  )}
                >
                  {p.name}
                </span>
                {isActive ? (
                  <CheckIcon className="size-[18px] shrink-0 text-primary" />
                ) : null}
              </button>
              <Link
                href={{
                  pathname: "/groups/[projectId]/settings",
                  params: { projectId: p.id },
                }}
                className="p-2 text-muted-foreground transition-opacity hover:opacity-70"
                aria-label={tNav("manageGroups")}
              >
                <Settings2Icon className="size-5" />
              </Link>
            </div>
          );
        })}
        <CreateProjectForm
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 border-border border-t px-4 py-2.5 text-left text-primary transition-opacity hover:opacity-80"
            >
              <span className="flex size-[38px] items-center justify-center rounded-[11px] border-[1.5px] border-primary border-dashed">
                <PlusIcon className="size-5" />
              </span>
              {tGroups("createTitle")}
            </button>
          }
        />
      </div>

      <Link
        href="/groups"
        className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
      >
        <LayoutGridIcon className="size-[22px] shrink-0 text-primary" />
        <span className="flex-1 font-bold">{tNav("manageGroups")}</span>
        <ChevronRightIcon className="size-[18px] text-muted-foreground" />
      </Link>

      <button
        type="button"
        onClick={openFeedback}
        className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <MessageSquarePlusIcon className="size-[22px] shrink-0 text-primary" />
        <span className="flex-1 font-bold">{tNav("feedback")}</span>
        <ChevronRightIcon className="size-[18px] text-muted-foreground" />
      </button>

      <div className="flex items-stretch gap-3">
        <Link
          href="/profile"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
        >
          <UserAvatar user={session?.user ?? {}} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">
              {session?.user?.name ?? tNav("profile")}
            </div>
            {session?.user?.email ? (
              <div className="truncate text-[13px] text-muted-foreground">
                {session.user.email}
              </div>
            ) : null}
          </div>
          <ChevronRightIcon className="size-[18px] shrink-0 text-muted-foreground" />
        </Link>
        <Link
          href="/profile"
          className="flex aspect-square items-center justify-center rounded-[14px] border border-border bg-card px-4 transition-colors hover:bg-accent"
          aria-label={tNav("profile")}
        >
          <SettingsIcon className="size-[22px] text-muted-foreground" />
        </Link>
      </div>

      <Link
        href="/changelog"
        className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-card px-4 py-3 text-muted-foreground text-xs transition-colors hover:bg-accent"
      >
        <span>{tChangelog("versionLabel")}</span>
        <span>v{CURRENT_VERSION}</span>
      </Link>
    </div>
  );
}
