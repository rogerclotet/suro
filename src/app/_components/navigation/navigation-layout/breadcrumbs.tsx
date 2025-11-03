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

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { project } = useProjects();
  const breadcrumbs = useMemo(() => {
    return pathname
      .replace(`/grups/${project?.id}`, "")
      .split("/")
      .filter(Boolean);
  }, [pathname, project?.id]);

  const isCurrentPath = useMemo(
    () => pathname === (breadcrumbs[breadcrumbs.length - 1] ?? ""),
    [pathname, breadcrumbs],
  );

  if (!project) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-lg">
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb}>
            {index > 0 && <BreadcrumbSeparator />}

            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 || isCurrentPath ? (
                <BreadcrumbPage className="font-semibold capitalize">
                  {breadcrumb}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={`/grups/${project.id}/${breadcrumb}`}
                  className="font-semibold capitalize"
                >
                  {breadcrumb}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
