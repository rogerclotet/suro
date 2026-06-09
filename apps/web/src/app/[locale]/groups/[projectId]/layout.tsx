import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAuthToken } from "@/lib/convex/server";
import CurrentProjectUpdater from "./_components/current-project-updater";

type Props = {
  params: Promise<{ projectId: string }>;
  children: ReactNode;
};

export default async function ProjectLayout({ params, children }: Props) {
  const { projectId } = await params;

  return (
    <>
      <CurrentProjectUpdater projectId={projectId} />
      {children}
    </>
  );
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
