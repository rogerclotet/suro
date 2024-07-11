import { getProjects } from "@/server/projects";
import ProjectsUpdater from "./projects-updater";

export default async function ProjectsLoader() {
  const projects = await getProjects();

  return <ProjectsUpdater projects={projects} />;
}
