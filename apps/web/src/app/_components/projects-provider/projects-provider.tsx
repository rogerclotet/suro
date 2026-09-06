"use client";

import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import { adaptProject } from "@/app/_data/project";
import { useSession } from "@/lib/session";
import { ProjectSelectionProvider } from "./project-selection-provider";

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
  const { data: session } = useSession();
  const { projectId } = useParams<{ projectId?: string }>();
  const userId = isAuthenticated ? (session?.user.id ?? null) : null;
  const projects = useMemo(() => (data ?? []).map(adaptProject), [data]);

  return (
    <ProjectSelectionProvider
      key={userId ?? "signed-out"}
      projects={userId ? projects : []}
      userId={userId}
      routeProjectId={projectId}
    >
      {children}
    </ProjectSelectionProvider>
  );
}
