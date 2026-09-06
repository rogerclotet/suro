"use client";

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/loading-page";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import { useProjects } from "../_state/project-state";
import OnboardingWalkthrough from "./onboarding/onboarding-walkthrough";

export default function Redirect({ projectId }: { projectId?: string }) {
  const { projects, project: selectedProject } = useProjects();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  const sessionReady = status === "authenticated";
  const needsOnboarding =
    !onboardingSkipped &&
    sessionReady &&
    session?.user.onboardingCompleted === false;

  const targetProjectId = projectId ?? selectedProject?.id;

  useEffect(() => {
    if (
      sessionReady &&
      !needsOnboarding &&
      targetProjectId &&
      projects.length > 0
    ) {
      router.push({
        pathname: "/groups/[projectId]/home",
        params: { projectId: targetProjectId },
      });
    }
  }, [sessionReady, needsOnboarding, targetProjectId, projects.length, router]);

  if (needsOnboarding && targetProjectId && session?.user) {
    return (
      <OnboardingWalkthrough
        user={session.user}
        onComplete={() => setOnboardingSkipped(true)}
      />
    );
  }

  return <LoadingPage />;
}
