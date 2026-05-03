import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getInvitedProject } from "@/server/projects";
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

  const project = await getInvitedProject(projectId);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name}`,
    description: "Suro - Gestor de grups",
  };
}
