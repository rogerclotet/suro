import { api } from "backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProjectRouteGuard from "@/app/_components/projects-provider/project-route-guard";
import { getAuthToken } from "@/lib/convex/server";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <ProjectRouteGuard>{children}</ProjectRouteGuard>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;

  const token = await getAuthToken();
  if (!token) {
    return {};
  }

  // Match against memberships so malformed URL IDs never reach an ID validator.
  // Metadata is optional; page queries still surface unexpected failures.
  const projects = await fetchQuery(api.projects.listMine, {}, { token }).catch(
    () => [],
  );
  const project = projects.find((project) => project._id === projectId);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name}`,
    description: "Suro - Gestor de grups",
  };
}
