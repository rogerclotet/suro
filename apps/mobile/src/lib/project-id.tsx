import type { Id } from "backend/convex/_generated/dataModel";
import { createContext, type ReactNode, useContext } from "react";

/**
 * The active group id, owned by the `[projectId]` route segment and shared with
 * every descendant screen.
 *
 * `useLocalSearchParams` is unreliable here: the segment belongs to the parent
 * Tabs navigator, so tab siblings (and screens pre-mounted while unfocused) read
 * an empty params object and see `projectId` as undefined. Reading it once at the
 * layout that owns the segment and passing it down via context avoids that.
 */
const ProjectIdContext = createContext<Id<"projects"> | null>(null);

export function ProjectIdProvider({
  projectId,
  children,
}: {
  projectId: Id<"projects">;
  children: ReactNode;
}) {
  return (
    <ProjectIdContext.Provider value={projectId}>
      {children}
    </ProjectIdContext.Provider>
  );
}

export function useProjectId(): Id<"projects"> {
  const projectId = useContext(ProjectIdContext);
  if (!projectId) {
    throw new Error("useProjectId must be used within a ProjectIdProvider");
  }
  return projectId;
}
