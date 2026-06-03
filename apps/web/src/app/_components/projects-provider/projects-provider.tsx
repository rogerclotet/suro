import type { ReactNode } from "react";
import { getProjects } from "@/server/projects";
import ProjectsUpdater from "./projects-updater";

export default async function ProjectsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const projects = await getProjects();

  return <ProjectsUpdater projects={projects}>{children}</ProjectsUpdater>;
}
