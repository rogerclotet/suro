import type { getProjects } from "@/server/projects";

export type User = Awaited<
  ReturnType<typeof getProjects>
>[number]["users"][number]["user"];
