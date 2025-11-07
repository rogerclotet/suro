"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { useProjects } from "@/app/_state/project-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMenuItems } from "../use-menu-items";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { project } = useProjects();
  const menuItems = useMenuItems();

  const allowedBreadcrumbs = useMemo(() => {
    const explicitlyAllowedBreadcrumbs = ["grups"];
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
      return ["família"];
    }

    return breadcrumbsFromPathname;
  }, [pathname, project?.id, allowedBreadcrumbs]);

  const isCurrentPath = useMemo(
    () => pathname === (breadcrumbs[breadcrumbs.length - 1] ?? ""),
    [pathname, breadcrumbs],
  );

  const { isMobile } = useSidebar();

  if (!project) {
    return (
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isMobile && (
        <>
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </>
      )}

      <Breadcrumb>
        <BreadcrumbList className="text-lg">
          {breadcrumbs.map((breadcrumb, index) => (
            <Fragment key={breadcrumb}>
              {index > 0 && <BreadcrumbSeparator />}

              <BreadcrumbItem>
                {isCurrentPath ? (
                  <BreadcrumbPage className="font-semibold capitalize">
                    {breadcrumb}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={`/grups/${project.id}/${breadcrumb}`}
                    className={cn(
                      "font-semibold capitalize",
                      index === breadcrumbs.length - 1 && "text-foreground",
                    )}
                  >
                    {breadcrumb}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
