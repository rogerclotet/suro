"use client";

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/loading-page";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import type { Project } from "../_data/project";
import { useProjects } from "../_state/project-state";
import OnboardingWalkthrough from "./onboarding/onboarding-walkthrough";

export default function Redirect({ project }: { project?: Project }) {
  const { projects, project: selectedProject, selectProject } = useProjects();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  const sessionReady = status === "authenticated";
  const needsOnboarding =
    !onboardingSkipped &&
    sessionReady &&
    session?.user.onboardingCompleted === false;

  useEffect(() => {
    if (project) {
      selectProject(project);
    } else if (!selectedProject && projects && projects.length > 0) {
      selectProject(undefined);
    }
  }, [project, projects, selectedProject, selectProject]);

  const projectId = project?.id ?? selectedProject?.id;

  useEffect(() => {
    if (sessionReady && !needsOnboarding && projectId && projects.length > 0) {
      router.push({
        pathname: "/groups/[projectId]/lists",
        params: { projectId },
      });
    }
  }, [sessionReady, needsOnboarding, projectId, projects.length, router]);

  if (needsOnboarding && projectId && session?.user) {
    return (
      <OnboardingWalkthrough
        user={session.user}
        onComplete={() => setOnboardingSkipped(true)}
      />
    );
  }

  return <LoadingPage />;
}
