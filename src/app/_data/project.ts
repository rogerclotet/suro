// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { getProjects } from "@/server/projects";

export type Project = Awaited<ReturnType<typeof getProjects>>[number];
export type Category = Project["categories"][number];
