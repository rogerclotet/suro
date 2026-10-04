"use client";

import { useConvexAuth } from "convex/react";
import { notFound, useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { useProjects } from "@/app/_state/project-state";
import LoadingPage from "@/components/ui/loading-page";

export default function ProjectRouteGuard({
  children,
}: {
  children: ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const { project, isLoading } = useProjects();
  const { isAuthenticated } = useConvexAuth();

  // Invitations must work before joining, including while signed out.
  if (segment === "invitation") return children;
  if (isLoading) return <LoadingPage />;
  // Signed-out requests keep the pages' existing server-side login redirect.
  if (!isAuthenticated) return children;

  // Use the membership subscription before mounting any project queries.
  // Malformed IDs, deleted groups and inaccessible groups all take this path.
  // Convex still enforces permissions independently on every query/mutation.
  if (!project) notFound();

  return children;
}
