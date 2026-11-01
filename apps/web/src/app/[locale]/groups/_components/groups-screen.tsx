"use client";

import { PlusIcon, Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import CreateProjectForm from "@/app/[locale]/groups/_components/create-project/create-project-form";
import ProjectAvatar from "@/components/project-avatar";
import { UnreadBadge, UnreadDot } from "@/components/unread-badge";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import { Link, useRouter } from "@/i18n/navigation";
import { unreadCount } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import { cn } from "@/lib/utils";

const MEMBER_PREVIEW = 3;

/** "Anna, Pau, Marta · +2", like the native Groups list. */
function memberSummary(p: Project, unnamed: string) {
  const names = p.users
    .slice(0, MEMBER_PREVIEW)
    .map((member) => member.user.name ?? unnamed)
    .join(", ");
  const rest = p.users.length - MEMBER_PREVIEW;
  return rest > 0 ? `${names} · +${rest}` : names;
}

/**
 * Every group the user belongs to: open one, reach its settings (members,
 * invites, leaving or deleting), or create another. The header's group chip
 * links here; profile lives in the header and the sidebar.
 */
export default function GroupsScreen() {
  const { projects, project, selectProject } = useProjects();
  const router = useRouter();
  const tGroups = useTranslations("groups");
  const tChangelog = useTranslations("changelog");
  const unread = useUnreadNotifications();

  function openGroup(p: Project) {
    selectProject(p);
    router.push(`/groups/${p.id}/home` as never);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 py-2">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        {projects.map((p, index) => {
          const isActive = p.id === project?.id;
          const count = unreadCount(unread, p.id);
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-1 px-4",
                index > 0 && "border-t border-border",
              )}
            >
              <button
                type="button"
                onClick={() => openGroup(p)}
                aria-current={isActive ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left transition-opacity hover:opacity-80"
              >
                <ProjectAvatar
                  project={p}
                  className="h-[38px] w-[38px] shrink-0 text-sm"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    className={cn(
                      "truncate",
                      isActive && "text-primary",
                      isActive || count ? "font-bold" : "font-normal",
                    )}
                  >
                    {p.name}
                  </span>
                  {p.users.length > 1 ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {memberSummary(p, tGroups("unnamedMember"))}
                    </span>
                  ) : null}
                </span>
                <UnreadBadge count={count} />
              </button>
              <Link
                href={{
                  pathname: "/groups/[projectId]/settings",
                  params: { projectId: p.id },
                }}
                className="relative p-2 text-muted-foreground transition-opacity hover:opacity-70"
                aria-label={tGroups("manageTitle")}
              >
                <Settings2Icon className="size-5" />
                <UnreadDot
                  count={unreadCount(unread, p.id, "members")}
                  className="absolute top-1.5 right-1.5"
                />
              </Link>
            </div>
          );
        })}
        <CreateProjectForm
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left text-primary transition-opacity hover:opacity-80"
            >
              <span className="flex size-[38px] items-center justify-center rounded-[11px] border-[1.5px] border-dashed border-primary">
                <PlusIcon className="size-5" />
              </span>
              {tGroups("createTitle")}
            </button>
          }
        />
      </div>

      <Link
        href="/changelog"
        className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-card px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-accent md:hidden"
      >
        <span>{tChangelog("versionLabel")}</span>
        <span>v{CURRENT_VERSION}</span>
      </Link>
    </div>
  );
}
