"use client";

import { MessageSquarePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { useFeedback } from "@/app/_state/feedback-state";
import { useProjects } from "@/app/_state/project-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/user-avatar";
import type { NavKey } from "@/i18n/message-keys";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import { mobileHeaderSectionKey, useMenuItems } from "../use-menu-items";

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
  groups: (projectId) => ({
    pathname: "/groups/[projectId]/groups",
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
  const { openFeedback } = useFeedback();
  const { data: session } = useSession();
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  const standaloneTitleKey = standalonePages[pathname];
  const sectionKey = mobileHeaderSectionKey(pathname);

  if (!project && !standaloneTitleKey) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  const titleKey = standaloneTitleKey ?? sectionKey ?? "home";

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <span className="min-w-0 font-semibold text-lg leading-tight">
        {tNav(titleKey)}
      </span>
      {titleKey === "groups" && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={openFeedback}
            className="min-h-11 gap-1.5 rounded-xl px-2.5 font-normal text-muted-foreground text-xs shadow-none"
          >
            <MessageSquarePlusIcon className="size-[18px]" aria-hidden="true" />
            {tNav("feedback")}
          </Button>
          <Button asChild variant="ghost" className="size-11 rounded-full p-0">
            <Link href="/profile" aria-label={tNav("profile")}>
              <UserAvatar user={session?.user ?? {}} />
            </Link>
          </Button>
        </div>
      )}
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
        .map((entry) => entry.path?.split("/").pop())
        .filter((segment): segment is string => Boolean(segment)),
    );

    return [...standaloneBreadcrumbs, ...breadcrumbsFromMenuItems];
  }, [menuItems]);

  const breadcrumbs = useMemo(() => {
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
