import { getInvitedProject } from "@/server/projects";
import type { Metadata } from "next";
import CurrentProjectUpdater from "./_components/current-project-updater";

type Props = {
  params: { projectId: string };
  children: React.ReactNode;
};

export default function ProjectLayout({
  params: { projectId },
  children,
}: Props) {
  return (
    <>
      <CurrentProjectUpdater projectId={projectId} />
      {children}
    </>
  );
}

export async function generateMetadata({
  params: { projectId },
}: Props): Promise<Metadata> {
  const project = await getInvitedProject(projectId);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name}`,
    description: "Família - Gestor familiar",
  };
}
