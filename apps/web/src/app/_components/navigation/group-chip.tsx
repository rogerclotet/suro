"use client";

import { matchesGroupSearch } from "domain/group-search";
import {
  CheckIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import ProjectAvatar from "@/components/project-avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { UnreadBadge, UnreadDot } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { unreadCount, unreadElsewhere } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import { cn } from "@/lib/utils";
import { useSwitchGroup } from "./use-switch-group";

// Short lists scan faster than they search.
const SEARCH_THRESHOLD = 6;

/**
 * The mobile header's group: avatar and name, with a dot for unread changes in
 * other groups or in this group's members. It opens the switcher, which keeps
 * the current section.
 */
export function GroupChip({ project }: { project: Project }) {
  const { projects } = useProjects();
  const switchGroup = useSwitchGroup();
  const unread = useUnreadNotifications();
  const tGroups = useTranslations("groups");
  const tNav = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const shown = projects.filter((p) =>
    matchesGroupSearch(
      { name: p.name, members: p.users.map((u) => u.user) },
      search,
    ),
  );
  const dot =
    unreadElsewhere(unread, project.id) +
    unreadCount(unread, project.id, "members");

  function choose(next: Project) {
    setOpen(false);
    if (next.id !== project.id) switchGroup(next);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
      shouldScaleBackground={false}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl text-left transition-opacity active:opacity-60"
          aria-label={tGroups("switchGroupFrom", { name: project.name })}
        >
          <ProjectAvatar
            project={project}
            className="size-7 shrink-0 text-xs"
          />
          <span className="min-w-0 truncate text-lg leading-tight font-semibold">
            {project.name}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          <UnreadDot count={dot} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{tGroups("switchGroup")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-col gap-2 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {projects.length >= SEARCH_THRESHOLD ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
              <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tGroups("searchPlaceholder")}
                aria-label={tGroups("searchPlaceholder")}
                className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          ) : null}
          <div className="max-h-[50vh] overflow-y-auto">
            {shown.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {tGroups("noSearchResults")}
              </p>
            ) : (
              shown.map((p) => {
                const current = p.id === project.id;
                const count = unreadCount(unread, p.id);
                return (
                  <div key={p.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => choose(p)}
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "flex min-h-[52px] min-w-0 flex-1 items-center gap-3 text-left transition-opacity active:opacity-60",
                        current && "text-primary",
                      )}
                    >
                      <ProjectAvatar project={p} className="size-9 shrink-0" />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          current || count ? "font-bold" : "font-normal",
                        )}
                      >
                        {p.name}
                      </span>
                      <UnreadBadge count={count} />
                      {current ? (
                        <CheckIcon className="size-5 shrink-0 text-primary" />
                      ) : null}
                    </button>
                    {current ? (
                      <Link
                        href={{
                          pathname: "/groups/[projectId]/settings",
                          params: { projectId: p.id },
                        }}
                        onClick={() => setOpen(false)}
                        className="relative p-3 text-muted-foreground transition-opacity active:opacity-60"
                        aria-label={tGroups("manageTitle")}
                      >
                        <Settings2Icon className="size-5" />
                        <UnreadDot
                          count={unreadCount(unread, p.id, "members")}
                          className="absolute top-2 right-2"
                        />
                      </Link>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
          <Link
            href="/groups"
            onClick={() => setOpen(false)}
            className="flex min-h-[52px] items-center gap-3 border-t border-border font-bold transition-opacity active:opacity-60"
          >
            <span className="flex size-9 items-center justify-center">
              <LayoutGridIcon className="size-[22px] text-primary" />
            </span>
            {tNav("allGroups")}
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
