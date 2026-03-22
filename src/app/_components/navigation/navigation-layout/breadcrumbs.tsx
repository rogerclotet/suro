"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import type { Project } from "@/app/_data/project";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMenuItems } from "../use-menu-items";

const explicitlyAllowedBreadcrumbs = ["grups", "perfil", "notificacions"];

function MobileHeader() {
  const { project, projects, selectProject } = useProjects();
  const router = useRouter();
  const pathname = usePathname();
  const menuItems = useMenuItems();

  const currentSectionName = useMemo(() => {
    if (pathname === "/perfil") return "Perfil";
    if (pathname === "/notificacions") return "Notificacions";
    const activeItem = menuItems.find(
      (item) => item.path !== "/" && pathname.includes(item.path),
    );
    return activeItem?.name;
  }, [menuItems, pathname]);

  function handleProjectSelect(p: Project) {
    selectProject(p);
    const currentSection = pathname
      .split(`/grups/${project?.id}/`)[1]
      ?.split("/")[0];
    const targetPath = currentSection
      ? `/grups/${p.id}/${currentSection}`
      : `/grups/${p.id}`;
    router.push(targetPath);
  }

  if (!project) {
    return (
      <div className="flex w-full items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 max-w-[40vw] shrink items-center gap-1.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-accent focus:outline-none">
            <ProjectAvatar project={project} className="h-7 w-7 text-xs" />
            <span className="truncate text-muted-foreground text-sm">
              {project.name}
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="min-w-48 max-w-[calc(100vw-2rem)] rounded-lg"
          >
            <DropdownMenuLabel>Grups</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => handleProjectSelect(p)}
                disabled={project.id === p.id}
                className={cn(
                  "py-3",
                  project.id === p.id
                    ? "bg-secondary text-secondary-foreground"
                    : "",
                )}
              >
                <ProjectAvatar
                  project={p}
                  className="h-5 w-5 shrink-0 text-xs"
                />
                <span className="min-w-0 truncate">{p.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {currentSectionName && (
          <>
            <span className="text-muted-foreground/50">|</span>
            <span className="font-semibold text-lg leading-tight">
              {currentSectionName}
            </span>
          </>
        )}
      </div>
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
      return ["família"];
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
  const { isMobile } = useSidebar();

  if (isMobile) {
    return <MobileHeader />;
  }

  return <DesktopBreadcrumbs />;
}
