"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import ProjectAvatar from "@/components/project-avatar";
import { UnreadDot } from "@/components/unread-badge";
import type { NavKey } from "@/i18n/message-keys";
import { Link } from "@/i18n/navigation";
import { unreadCount, unreadElsewhere } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";

const BACK_CLASSES =
  "-ml-2 flex min-h-11 min-w-11 shrink-0 items-center text-primary transition-opacity active:opacity-60";

/**
 * A bottom-bar section's header: Back to the groups list, carrying the other
 * groups' unread count, then the group's avatar and name, which open its
 * settings. Member changes put a dot on the avatar.
 */
export function GroupTabHeader({ project }: { project: Project }) {
  const unread = useUnreadNotifications();
  const tGroups = useTranslations("groups");
  const tNotifications = useTranslations("notifications");
  const elsewhere = unreadElsewhere(unread, project.id);
  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <Link
        href="/groups"
        className={BACK_CLASSES}
        aria-label={
          elsewhere
            ? `${tGroups("backToGroups")}, ${tNotifications("unreadCount", { count: elsewhere })}`
            : tGroups("backToGroups")
        }
      >
        <ChevronLeftIcon className="size-7" aria-hidden />
        {elsewhere ? (
          <span className="text-base tabular-nums">
            {elsewhere > 99 ? "99+" : elsewhere}
          </span>
        ) : null}
      </Link>
      <Link
        href={{
          pathname: "/groups/[projectId]/settings",
          params: { projectId: project.id },
        }}
        className="flex min-h-11 min-w-0 items-center gap-2 transition-opacity active:opacity-60"
        aria-label={`${project.name}, ${tGroups("manageTitle")}`}
      >
        <span className="relative shrink-0">
          <ProjectAvatar project={project} className="size-7 text-xs" />
          <UnreadDot
            count={unreadCount(unread, project.id, "members")}
            className="absolute -top-0.5 -right-0.5 size-2.5 ring-2 ring-background"
          />
        </span>
        <span className="min-w-0 truncate text-lg leading-tight font-semibold">
          {project.name}
        </span>
      </Link>
    </div>
  );
}

/**
 * Any other page in a group: Back one level up, then where the user is, with
 * the group underneath since no tab names it.
 */
export function GroupNestedHeader({
  project,
  parent,
  titleKey,
}: {
  project: Project;
  parent: string;
  titleKey: NavKey | null;
}) {
  const params = useParams();
  const tNav = useTranslations("nav");
  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <Link
        href={{ pathname: parent, params } as never}
        className={BACK_CLASSES}
        aria-label={tNav("back")}
      >
        <ChevronLeftIcon className="size-7" aria-hidden />
      </Link>
      <div className="flex min-w-0 flex-col">
        {titleKey ? (
          <span className="truncate text-lg leading-tight font-semibold">
            {tNav(titleKey)}
          </span>
        ) : null}
        <span className="truncate text-xs text-muted-foreground">
          {project.name}
        </span>
      </div>
    </div>
  );
}
