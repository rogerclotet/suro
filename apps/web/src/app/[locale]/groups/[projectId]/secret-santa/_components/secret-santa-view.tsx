"use client";

import {
  drawProblem,
  exchangeHasPassed,
  MIN_PARTICIPANTS_FOR_EXCLUSIONS,
} from "domain/secret-santa";
import {
  ArchiveIcon,
  ChevronRightIcon,
  GiftIcon,
  HourglassIcon,
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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
import { SectionLabel, StatusLine } from "./layout";
import ParticipantTile from "./participant-tile";

export default function SecretSantaView({ projectId }: { projectId: string }) {
  const { project } = useProjects();
  const secretSanta = useCurrentSecretSanta(projectId);

  if (secretSanta === undefined || project === null) {
    return <LoadingPage />;
  }

  if (secretSanta === null) {
    const canCreate = project.users.length >= 2;
    return (
      <>
        <Intro canCreate={canCreate} />
        {canCreate && <CreateButton project={project} />}
      </>
    );
  }

  return (
    <div className="mb-8 max-w-3xl space-y-6">
      <SecretSantaInfo secretSanta={secretSanta} members={project.users} />
      <Separator />
      <ParticipationStatus secretSanta={secretSanta} project={project} />
    </div>
  );
}

/** What a Secret Santa is and how one runs, before the group has one. */
function Intro({ canCreate }: { canCreate: boolean }) {
  const t = useTranslations("secretSanta");
  const steps = [
    t("emptyStepDetails"),
    t("emptyStepIdeas"),
    t("emptyStepDraw"),
  ];
  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GiftIcon className="size-8" />
        </span>
        <h2 className="font-display font-semibold text-xl">
          {canCreate ? t("emptyTitle") : t("infoDescription")}
        </h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Separator />
      <section className="space-y-3">
        <SectionLabel>{t("howItWorks")}</SectionLabel>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="w-4 shrink-0 text-center font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
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
          <StatusLine icon={ArchiveIcon} text={t("exchangePassedHint")} />
        )}
        <Assignment assignment={secretSanta.assignment} />
        <GiftIdeasLink secretSanta={secretSanta} projectId={project.id} />
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
        <StatusLine icon={InfoIcon} text={t("notParticipating")} />
      ) : secretSanta.isParticipant ? (
        <StatusLine icon={HourglassIcon} text={t("waitingForDraw")} />
      ) : (
        <StatusLine icon={InfoIcon} text={t("notParticipatingYet")} />
      )}
      {exchangePassed && (
        <StatusLine icon={ArchiveIcon} text={t("exchangePassedHint")} />
      )}
      {secretSanta.isParticipant && (
        <GiftIdeasLink secretSanta={secretSanta} projectId={project.id} />
      )}

      <section className="space-y-3">
        <SectionLabel count={secretSanta.participants.length}>
          {t("participants")}
        </SectionLabel>
        <div className="flex flex-wrap gap-y-2">
          {secretSanta.participants.map((person) => (
            <ParticipantTile
              key={person.id}
              person={person}
              fallbackName={t("unnamedMember")}
            />
          ))}
        </div>
      </section>

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
      {problem === null ? (
        <p className="text-muted-foreground text-sm">{t("drawHint")}</p>
      ) : (
        <StatusLine
          icon={TriangleAlertIcon}
          tone="warning"
          text={
            problem === "tooFewParticipants"
              ? t("validationMinParticipants")
              : t("drawBlockedByExclusions")
          }
        />
      )}
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
    <Item variant="outline" size="sm" className="max-w-md bg-card" asChild>
      <Link
        href={{
          pathname: "/groups/[projectId]/secret-santa/ideas",
          params: { projectId },
        }}
      >
        <ItemMedia className="size-8 rounded-lg bg-primary/10 text-primary">
          <LightbulbIcon className="size-4" />
        </ItemMedia>
        <ItemContent className="gap-0">
          <ItemTitle>{t("myIdeasAction")}</ItemTitle>
          {giftIdeas !== undefined && (
            <ItemDescription>
              {t("myIdeasSummary", { count: giftIdeas.length })}
            </ItemDescription>
          )}
        </ItemContent>
        <ItemActions>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </ItemActions>
      </Link>
    </Item>
  );
}
