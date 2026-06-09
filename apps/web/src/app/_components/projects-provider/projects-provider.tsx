"use client";

import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { type ReactNode, useMemo } from "react";
import { adaptProject } from "@/app/_data/project";
import ProjectsUpdater from "./projects-updater";

export default function ProjectsProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Mounted in the locale layout, so it also renders for signed-out visitors
  // (e.g. an invite link in an incognito window). listMineDetailed requires
  // auth, so skip it until the session resolves to avoid a "Not logged in".
  const { isAuthenticated } = useConvexAuth();
  const data = useQuery(
    api.projects.listMineDetailed,
    isAuthenticated ? {} : "skip",
  );
  const projects = useMemo(() => (data ?? []).map(adaptProject), [data]);

  return <ProjectsUpdater projects={projects}>{children}</ProjectsUpdater>;
}
