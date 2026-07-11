"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { useProjects } from "@/app/_state/project-state";
import ProjectAvatar from "@/components/project-avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavKey } from "@/i18n/message-keys";
import { Link, usePathname } from "@/i18n/navigation";
import GroupSwitcherSheet from "../group-switcher-sheet";
import { useMenuItems } from "../use-menu-items";

const standaloneBreadcrumbs = ["groups", "profile"];

type BreadcrumbHref = Parameters<typeof Link>[0]["href"];
type HrefFactory = (projectId: string) => BreadcrumbHref;

const breadcrumbHrefMap: Record<string, HrefFactory> = {
  home: (projectId) => ({
    pathname: "/groups/[projectId]/home",
    params: { projectId },
  }),
  lists: (projectId) => ({
    pathname: "/groups/[projectId]/lists",
    params: { projectId },
  }),
  "lists/templates": (projectId) => ({
    pathname: "/groups/[projectId]/lists/templates",
    params: { projectId },
  }),
  calendar: (projectId) => ({
    pathname: "/groups/[projectId]/calendar",
    params: { projectId },
  }),
  files: (projectId) => ({
    pathname: "/groups/[projectId]/files",
    params: { projectId },
  }),
  notes: (projectId) => ({
    pathname: "/groups/[projectId]/notes",
    params: { projectId },
  }),
  expenses: (projectId) => ({
    pathname: "/groups/[projectId]/expenses",
    params: { projectId },
  }),
  "secret-santa": (projectId) => ({
    pathname: "/groups/[projectId]/secret-santa",
    params: { projectId },
  }),
} as Record<string, HrefFactory>;

const standalonePages: Record<string, NavKey> = {
  "/profile": "profile",
  "/groups": "groups",
};

const breadcrumbToTranslationKey: Record<string, NavKey> = {
  groups: "groups",
  profile: "profile",
  home: "home",
  lists: "lists",
  templates: "templates",
  calendar: "calendar",
  files: "files",
  notes: "notes",
  expenses: "expenses",
  "secret-santa": "secretSanta",
  ideas: "ideas",
};

function MobileHeader() {
  const { project } = useProjects();
  const pathname = usePathname();
  const [groupSwitcherOpen, setGroupSwitcherOpen] = useState(false);
  const tNav = useTranslations("nav");

  const standaloneTitleKey = standalonePages[pathname];

  if (!project) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2 px-1 py-0.5">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    );
  }

  if (standaloneTitleKey) {
    return (
      <div className="flex w-full items-center justify-between">
        <span className="font-semibold text-lg leading-tight">
          {tNav(standaloneTitleKey)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => setGroupSwitcherOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-accent focus:outline-none"
      >
        <ProjectAvatar project={project} className="h-7 w-7 shrink-0 text-xs" />
        <span className="truncate font-semibold text-base">{project.name}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      <GroupSwitcherSheet
        open={groupSwitcherOpen}
        onOpenChange={setGroupSwitcherOpen}
      />
    </div>
  );
}

function DesktopBreadcrumbs() {
  const pathname = usePathname();
  const { project } = useProjects();
  const menuItems = useMenuItems();
  const tNav = useTranslations("nav");

  const allowedBreadcrumbs = useMemo(() => {
    const breadcrumbsFromMenuItems = menuItems.flatMap((item) =>
      [item, ...(item.children ?? [])]
        // Guard against a missing path: an undefined entry would crash the
        // whole nav (and its error boundary) on `.split`, never an allowlist hit.
        .map((entry) => entry.path?.split("/").pop())
        .filter((segment): segment is string => Boolean(segment)),
    );

    return [...standaloneBreadcrumbs, ...breadcrumbsFromMenuItems];
  }, [menuItems]);

  const breadcrumbs = useMemo(() => {
    // pathname comes back from next-intl as the canonical template form, e.g.
    // "/groups/[projectId]/lists" — strip the project segment by template too.
    const breadcrumbsFromPathname = pathname
      .replace("/groups/[projectId]", "")
      .split("/")
      .filter((breadcrumb) => allowedBreadcrumbs.includes(breadcrumb));

    if (breadcrumbsFromPathname.length === 0) {
      return ["suro"];
    }

    return breadcrumbsFromPathname;
  }, [pathname, allowedBreadcrumbs]);

  if (!project) {
    return <Skeleton className="h-7 w-24" />;
  }

  function labelFor(breadcrumb: string) {
    const key = breadcrumbToTranslationKey[breadcrumb];
    if (key) {
      return tNav(key);
    }
    return breadcrumb.replace("-", " ");
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-lg">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const pathKey = breadcrumbs.slice(0, index + 1).join("/");
          const hrefFactory = breadcrumbHrefMap[pathKey];

          return (
            <Fragment key={breadcrumb}>
              {index > 0 && <BreadcrumbSeparator />}

              <BreadcrumbItem>
                {isLast ||
                standaloneBreadcrumbs.includes(breadcrumb) ||
                !hrefFactory ? (
                  <BreadcrumbPage className="font-semibold capitalize">
                    {labelFor(breadcrumb)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="font-semibold capitalize">
                    <Link href={hrefFactory(project.id) as never}>
                      {labelFor(breadcrumb)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function Breadcrumbs() {
  return (
    <>
      <div className="w-full md:hidden">
        <MobileHeader />
      </div>
      <div className="hidden md:block">
        <DesktopBreadcrumbs />
      </div>
    </>
  );
}
