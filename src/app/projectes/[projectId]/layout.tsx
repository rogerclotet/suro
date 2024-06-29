import { getInvitedProject } from "@/server/projects";
import type { Metadata } from "next";

type Props = {
  params: { projectId: string };
  children: React.ReactNode;
};

export default function ProjectLayout({ children }: Props) {
  return <>{children}</>;
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
