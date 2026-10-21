"use client";

import { MIN_PARTICIPANTS_FOR_EXCLUSIONS } from "domain/secret-santa";
import { InfoIcon, LightbulbIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import LoadingPage from "@/components/ui/loading-page";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { useCurrentSecretSanta } from "@/lib/queries/use-secret-santa";
import Assignment from "./assignment";
import CreateButton from "./create-button";
import DrawButton from "./draw-button";
import Exclusions from "./exclusions";
import SecretSantaInfo from "./info";
import ParticipantCard from "./participant-card";

export default function SecretSantaView({ projectId }: { projectId: string }) {
  const { project } = useProjects();
  const secretSanta = useCurrentSecretSanta(projectId);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  if (secretSanta === undefined || project === null) {
    return <LoadingPage />;
  }

  if (secretSanta === null) {
    if (project.users.length < 2) {
      return (
        <Alert className="mx-auto max-w-lg">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>{tCommon("info")}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{t("infoDescription")}</p>
            <p>{t("description")}</p>
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <>
        <Alert className="mx-auto max-w-lg">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>{t("emptyTitle")}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{t("description")}</p>
            <p>{t("emptyMessage")}</p>
          </AlertDescription>
        </Alert>
        <CreateButton project={project} />
      </>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <SecretSantaInfo secretSanta={secretSanta} members={project.users} />
      <Separator />
      <ParticipationStatus secretSanta={secretSanta} project={project} />
    </div>
  );
}

function ParticipationStatus({
  secretSanta,
  project,
}: {
  secretSanta: SecretSanta;
  project: Project;
}) {
  const t = useTranslations("secretSanta");

  if (secretSanta.drawn && secretSanta.assignment) {
    return (
      <>
        <GiftIdeasLink projectId={project.id} />
        <Assignment assignment={secretSanta.assignment} />
      </>
    );
  }

  return (
    <>
      {secretSanta.drawn ? (
        <p className="text-muted-foreground">{t("notParticipating")}</p>
      ) : (
        <p className="text-muted-foreground">
          {secretSanta.isParticipant
            ? t("waitingForDraw")
            : t("notParticipatingYet")}
        </p>
      )}
      {secretSanta.isParticipant && <GiftIdeasLink projectId={project.id} />}

      <h3 className="font-semibold text-lg">{t("participants")}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
        {secretSanta.participants.map((person) => (
          <ParticipantCard
            key={person.id}
            person={person}
            fallbackName={t("unnamedMember")}
          />
        ))}
      </div>

      {secretSanta.participants.length >= MIN_PARTICIPANTS_FOR_EXCLUSIONS && (
        <Exclusions secretSanta={secretSanta} />
      )}

      {secretSanta.canOrganize && !secretSanta.drawn && (
        <DrawButton secretSanta={secretSanta} />
      )}
    </>
  );
}

function GiftIdeasLink({ projectId }: { projectId: string }) {
  const t = useTranslations("secretSanta");
  return (
    <Button asChild variant="outline">
      <Link
        href={{
          pathname: "/groups/[projectId]/secret-santa/ideas",
          params: { projectId },
        }}
      >
        <LightbulbIcon />
        {t("myIdeasAction")}
      </Link>
    </Button>
  );
}
