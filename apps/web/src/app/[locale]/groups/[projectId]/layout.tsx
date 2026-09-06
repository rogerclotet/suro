import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAuthToken } from "@/lib/convex/server";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children;
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

  // Membership-gated; a non-member or missing project just yields no metadata.
  const project = await fetchQuery(
    api.projects.get,
    { projectId: projectId as Id<"projects"> },
    { token },
  ).catch(() => null);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name}`,
    description: "Suro - Gestor de grups",
  };
}
