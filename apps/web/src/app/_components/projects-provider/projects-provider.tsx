"use client";

import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { type ReactNode, useMemo } from "react";
import { adaptProject } from "@/app/_data/project";
import ProjectsUpdater from "./projects-updater";

export default function ProjectsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const data = useQuery(api.projects.listMineDetailed);
  const projects = useMemo(() => (data ?? []).map(adaptProject), [data]);

  return <ProjectsUpdater projects={projects}>{children}</ProjectsUpdater>;
}
