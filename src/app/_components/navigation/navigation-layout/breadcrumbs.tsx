"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import GroupSwitcherSheet from "../group-switcher-sheet";
import { useMenuItems } from "../use-menu-items";

const explicitlyAllowedBreadcrumbs = ["grups", "perfil", "notificacions"];

// Standalone pages (not scoped to a group) show their own title instead of the group switcher.
const standalonePages: Record<string, string> = {
  "/perfil": "Perfil",
  "/notificacions": "Notificacions",
  "/grups": "Grups",
};

function MobileHeader() {
  const { project } = useProjects();
  const pathname = usePathname();
  const [groupSwitcherOpen, setGroupSwitcherOpen] = useState(false);

  const standaloneTitle = standalonePages[pathname];

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

  // Non-group pages: show the page title, no group switcher
  if (standaloneTitle) {
    return (
      <div className="flex w-full items-center justify-between">
        <span className="font-semibold text-lg leading-tight">
          {standaloneTitle}
        </span>
        <OfflineIndicator />
      </div>
    );
  }

  // Group pages: full-width group switcher button, no section title
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
      <OfflineIndicator />

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

  const allowedBreadcrumbs = useMemo(() => {
    const breadcrumbsFromMenuItems = menuItems.flatMap((item) =>
      [item, ...(item.children ?? [])].map((item) =>
        item.path.split("/").pop(),
      ),
    );

    return [...explicitlyAllowedBreadcrumbs, ...breadcrumbsFromMenuItems];
  }, [menuItems]);

  const breadcrumbs = useMemo(() => {
    const breadcrumbsFromPathname = pathname
      .replace(`/grups/${project?.id}`, "")
      .split("/")
      .filter((breadcrumb) => allowedBreadcrumbs.includes(breadcrumb));

    if (breadcrumbsFromPathname.length === 0) {
      return ["suro"];
    }

    return breadcrumbsFromPathname;
  }, [pathname, project?.id, allowedBreadcrumbs]);

  const isCurrentPath = useMemo(
    () => pathname === (breadcrumbs[breadcrumbs.length - 1] ?? ""),
    [pathname, breadcrumbs],
  );

  if (!project) {
    return <Skeleton className="h-7 w-24" />;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-lg">
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb}>
            {index > 0 && <BreadcrumbSeparator />}

            <BreadcrumbItem>
              {isCurrentPath ||
              explicitlyAllowedBreadcrumbs.includes(breadcrumb) ? (
                <BreadcrumbPage className="font-semibold capitalize">
                  {breadcrumb.replace("-", " ")}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  asChild
                  className={cn(
                    "font-semibold capitalize",
                    index === breadcrumbs.length - 1 && "text-foreground",
                  )}
                >
                  <Link href={`/grups/${project.id}/${breadcrumb}`}>
                    {breadcrumb.replace("-", " ")}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
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
