import type { getProjects } from "@/server/projects";

export type Project = Awaited<ReturnType<typeof getProjects>>[number];
export type ProjectCategory = Project["categories"][number];
