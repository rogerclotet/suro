// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { getProjects } from "@/server/projects";

export type User = Awaited<
  ReturnType<typeof getProjects>
>[number]["users"][number]["user"];
