"use client";

import {
  drawProblem,
  exchangeHasPassed,
  MIN_PARTICIPANTS_FOR_EXCLUSIONS,
} from "domain/secret-santa";
import {
  ArchiveIcon,
  HourglassIcon,
  InfoIcon,
  LightbulbIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingPage from "@/components/ui/loading-page";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import {
  useCurrentSecretSanta,
  useMyGiftIdeas,
} from "@/lib/queries/use-secret-santa";
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
  const exchangePassed =
    secretSanta.canOrganize &&
    secretSanta.drawn &&
    exchangeHasPassed(
      {
        exchangeAt: secretSanta.exchangeAt.getTime(),
        exchangeAllDay: secretSanta.exchangeAllDay,
      },
      Date.now(),
    );

  if (secretSanta.drawn && secretSanta.assignment) {
    return (
      <>
        {exchangePassed && (
          <StatusNote icon={ArchiveIcon} text={t("exchangePassedHint")} />
        )}
        <GiftIdeasLink secretSanta={secretSanta} projectId={project.id} />
        <Assignment assignment={secretSanta.assignment} />
      </>
    );
  }

  // Stored groups stay visible (and removable) even below the size where new
  // ones can be added, so nothing blocking the draw is ever hidden.
  const canAddExclusion =
    secretSanta.canOrganize &&
    !secretSanta.drawn &&
    secretSanta.participants.length >= MIN_PARTICIPANTS_FOR_EXCLUSIONS;
  const showExclusions =
    !secretSanta.drawn &&
    (secretSanta.exclusions.length > 0 || canAddExclusion);

  return (
    <>
      {secretSanta.drawn ? (
        <StatusNote icon={InfoIcon} text={t("notParticipating")} />
      ) : secretSanta.isParticipant ? (
        <StatusNote icon={HourglassIcon} text={t("waitingForDraw")} />
      ) : (
        <StatusNote icon={InfoIcon} text={t("notParticipatingYet")} />
      )}
      {exchangePassed && (
        <StatusNote icon={ArchiveIcon} text={t("exchangePassedHint")} />
      )}
      {secretSanta.isParticipant && (
        <GiftIdeasLink secretSanta={secretSanta} projectId={project.id} />
      )}

      <h3 className="flex items-center gap-2 font-semibold text-lg">
        {t("participants")}
        <Badge
          variant="outline"
          className="border-transparent bg-muted text-primary"
        >
          {secretSanta.participants.length}
        </Badge>
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
        {secretSanta.participants.map((person) => (
          <ParticipantCard
            key={person.id}
            person={person}
            fallbackName={t("unnamedMember")}
          />
        ))}
      </div>

      {showExclusions && (
        <Exclusions
          secretSanta={secretSanta}
          editable={secretSanta.canOrganize}
          canAdd={canAddExclusion}
        />
      )}

      {secretSanta.canOrganize && !secretSanta.drawn && (
        <DrawSection secretSanta={secretSanta} />
      )}
    </>
  );
}

function StatusNote({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted p-3 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>{text}</p>
    </div>
  );
}

/**
 * The draw is checked here with the same rule the server applies, so an
 * impossible one is explained instead of attempted.
 */
function DrawSection({ secretSanta }: { secretSanta: SecretSanta }) {
  const t = useTranslations("secretSanta");
  const problem = drawProblem(
    secretSanta.participants.map((person) => person.id),
    secretSanta.exclusions,
  );
  return (
    <>
      <Separator />
      {problem !== null && (
        <Alert variant="destructive">
          <TriangleAlertIcon className="h-4 w-4" />
          <AlertDescription>
            {problem === "tooFewParticipants"
              ? t("validationMinParticipants")
              : t("drawBlockedByExclusions")}
          </AlertDescription>
        </Alert>
      )}
      <p className="text-muted-foreground text-sm">{t("drawHint")}</p>
      <DrawButton secretSanta={secretSanta} disabled={problem !== null} />
    </>
  );
}

function GiftIdeasLink({
  secretSanta,
  projectId,
}: {
  secretSanta: SecretSanta;
  projectId: string;
}) {
  const t = useTranslations("secretSanta");
  const giftIdeas = useMyGiftIdeas(secretSanta.id);
  return (
    <Button asChild variant="outline" className="h-auto justify-start py-2">
      <Link
        href={{
          pathname: "/groups/[projectId]/secret-santa/ideas",
          params: { projectId },
        }}
      >
        <LightbulbIcon className="text-secondary" />
        <span className="flex flex-col items-start text-left">
          <span>{t("myIdeasAction")}</span>
          {giftIdeas !== undefined && (
            <span className="whitespace-normal font-normal text-muted-foreground text-xs">
              {t("myIdeasSummary", { count: giftIdeas.length })}
            </span>
          )}
        </span>
      </Link>
    </Button>
  );
}
