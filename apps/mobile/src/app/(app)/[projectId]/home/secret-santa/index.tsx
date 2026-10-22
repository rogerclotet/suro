import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  exchangeHasPassed,
  MIN_PARTICIPANTS_FOR_EXCLUSIONS,
} from "domain/secret-santa";
import { Stack, useRouter } from "expo-router";
import {
  Archive,
  Ellipsis,
  Hourglass,
  Info,
  type LucideIcon,
  Pencil,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import {
  headerBackAction,
  headerCreateAction,
} from "@/components/header-badges";
import { DrawPanel } from "@/features/secret-santa/draw-panel";
import { secretSantaErrorMessage } from "@/features/secret-santa/errors";
import { ExclusionSheet } from "@/features/secret-santa/exclusion-sheet";
import { ExclusionsSection } from "@/features/secret-santa/exclusions-section";
import { SecretSantaFormSheet } from "@/features/secret-santa/form-sheet";
import {
  draftFrom,
  exchangeFromDraft,
  newDraft,
  priceRangeFromDraft,
  type SecretSantaDraft,
} from "@/features/secret-santa/form-values";
import { GiftIdeaRow } from "@/features/secret-santa/gift-idea-row";
import { SecretSantaIntro } from "@/features/secret-santa/intro";
import { MyIdeasRow } from "@/features/secret-santa/my-ideas-row";
import { Notice } from "@/features/secret-santa/notice";
import {
  ParticipantGrid,
  ParticipantStack,
  SectionTitle,
} from "@/features/secret-santa/participants";
import { RevealCard } from "@/features/secret-santa/reveal-card";
import { SummaryCard } from "@/features/secret-santa/summary-card";
import type { Person, SecretSanta } from "@/features/secret-santa/types";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Loading, Screen, Sheet, Txt } from "@/ui";

type Member = Pick<Person, "userId" | "name" | "image" | "avatarColor">;

export default function SecretSantaScreen() {
  const pid = useProjectId();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const secretSanta = usePersistentQuery(api.secretSantas.current, {
    projectId: pid,
  });
  const projectMembers = usePersistentQuery(api.projects.members, {
    projectId: pid,
  });
  const [optionsOpen, setOptionsOpen] = useState(false);

  const members: Member[] | undefined = projectMembers?.map((member) => ({
    userId: member._id,
    name: member.name,
    image: member.image,
    avatarColor: member.avatarColor,
  }));

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tNav("secretSanta"),
          ...headerBackAction(() => router.back(), tc("back")),
          ...headerCreateAction(
            undefined,
            secretSanta?.canOrganize
              ? [
                  {
                    icon: Ellipsis,
                    onPress: () => setOptionsOpen(true),
                    label: tSanta("settingsTitle"),
                  },
                ]
              : [],
          ),
        }}
      />
      {secretSanta === undefined || members === undefined ? (
        <Loading />
      ) : secretSanta === null ? (
        <CreateSecretSanta projectId={pid} members={members} />
      ) : (
        <SecretSantaDetail
          secretSanta={secretSanta}
          members={members}
          optionsOpen={optionsOpen}
          onCloseOptions={() => setOptionsOpen(false)}
        />
      )}
    </Screen>
  );
}

function CreateSecretSanta({
  projectId,
  members,
}: {
  projectId: Id<"projects">;
  members: Member[];
}) {
  const tSanta = useTranslations("secretSanta");
  const create = useMutation(api.secretSantas.create);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(draft: SecretSantaDraft) {
    setBusy(true);
    try {
      await create({
        projectId,
        name: draft.name,
        description: draft.description,
        ...exchangeFromDraft(draft),
        priceRange: priceRangeFromDraft(draft),
        participantIds: draft.participantIds as Id<"users">[],
      });
      setCreating(false);
    } catch (error) {
      Alert.alert(
        secretSantaErrorMessage(error, tSanta) ?? tSanta("createError"),
      );
    } finally {
      setBusy(false);
    }
  }

  const canCreate = members.length >= 2;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
      <SecretSantaIntro
        onCreate={canCreate ? () => setCreating(true) : undefined}
      />
      {canCreate ? (
        <SecretSantaFormSheet
          visible={creating}
          title={tSanta("createTitle")}
          initial={newDraft(
            tSanta("defaultName", { year: new Date().getFullYear() }),
            members.map((member) => member.userId),
          )}
          members={members}
          requireUpcoming
          busy={busy}
          submitLabel={tSanta("createAction")}
          onSubmit={submit}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </ScrollView>
  );
}

function SecretSantaDetail({
  secretSanta,
  members,
  optionsOpen,
  onCloseOptions,
}: {
  secretSanta: SecretSanta;
  members: Member[];
  optionsOpen: boolean;
  onCloseOptions: () => void;
}) {
  const t = useTheme();
  const pid = useProjectId();
  const router = useRouter();
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const update = useMutation(api.secretSantas.update);
  const archive = useMutation(api.secretSantas.archive);
  const myIdeas = usePersistentQuery(
    api.secretSantas.myGiftIdeas,
    secretSanta.isParticipant ? { secretSantaId: secretSanta._id } : "skip",
  );
  const [editing, setEditing] = useState(false);
  // iOS drops a Modal presented while another is still on screen, so the edit
  // sheet waits for the options sheet to finish closing.
  const [editAfterOptions, setEditAfterOptions] = useState(false);
  const [addingExclusion, setAddingExclusion] = useState(false);
  const [busy, setBusy] = useState(false);
  const drawn = secretSanta.drawnAt !== null;
  const { eventId, participants, exclusions, canOrganize } = secretSanta;

  // Members who left after the draw still take part, so list them too.
  const memberIds = new Set(members.map((member) => member.userId));
  const editableMembers = [
    ...members,
    ...participants.filter((participant) => !memberIds.has(participant.userId)),
  ];
  // Stored groups stay visible (and removable) even below the size where new
  // ones can be added, so nothing blocking the draw is ever hidden.
  const canAddExclusion =
    canOrganize &&
    !drawn &&
    participants.length >= MIN_PARTICIPANTS_FOR_EXCLUSIONS;
  const showExclusions = !drawn && (exclusions.length > 0 || canAddExclusion);

  async function submitEdit(draft: SecretSantaDraft) {
    setBusy(true);
    try {
      await update({
        secretSantaId: secretSanta._id,
        name: draft.name,
        description: draft.description,
        ...exchangeFromDraft(draft),
        priceRange: priceRangeFromDraft(draft),
        participantIds: draft.participantIds as Id<"users">[],
      });
      setEditing(false);
    } catch (error) {
      Alert.alert(
        secretSantaErrorMessage(error, tSanta) ?? tSanta("settingsEditError"),
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmArchive() {
    Alert.alert(
      tSanta("settingsArchiveTitle"),
      tSanta("settingsArchiveDescription"),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tSanta("settingsArchiveAction"),
          style: "destructive",
          onPress: () => {
            onCloseOptions();
            archive({ secretSantaId: secretSanta._id }).catch(() =>
              Alert.alert(tSanta("settingsArchiveError")),
            );
          },
        },
      ],
    );
  }

  const status = drawn
    ? secretSanta.assignment
      ? null
      : { icon: Info, text: tSanta("notParticipating") }
    : secretSanta.isParticipant
      ? { icon: Hourglass, text: tSanta("waitingForDraw") }
      : { icon: Info, text: tSanta("notParticipatingYet") };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 20 }}
    >
      <SummaryCard
        secretSanta={secretSanta}
        onOpenEvent={
          eventId ? () => router.navigate(`/${pid}/calendar/${eventId}`) : null
        }
      />

      {drawn && secretSanta.assignment ? (
        <Match assignment={secretSanta.assignment} />
      ) : null}
      {status ? <Notice icon={status.icon} text={status.text} /> : null}

      {secretSanta.isParticipant ? (
        <MyIdeasRow
          count={myIdeas?.length}
          onPress={() => router.push(`/${pid}/home/secret-santa/ideas`)}
        />
      ) : null}

      {canOrganize && drawn && exchangeHasPassed(secretSanta, Date.now()) ? (
        <Notice icon={Archive} text={tSanta("exchangePassedHint")} />
      ) : null}

      {drawn ? (
        <ParticipantStack participants={participants} />
      ) : (
        <ParticipantGrid participants={participants} />
      )}

      {showExclusions ? (
        <ExclusionsSection
          secretSanta={secretSanta}
          editable={canOrganize && !drawn}
          onAdd={canAddExclusion ? () => setAddingExclusion(true) : undefined}
        />
      ) : null}

      {canOrganize && !drawn ? <DrawPanel secretSanta={secretSanta} /> : null}

      <Sheet
        visible={optionsOpen}
        onClose={onCloseOptions}
        onClosed={() => {
          if (!editAfterOptions) return;
          setEditAfterOptions(false);
          setEditing(true);
        }}
      >
        <Txt size={18} weight="700">
          {secretSanta.name}
        </Txt>
        <OptionRow
          icon={Pencil}
          label={tSanta("settingsEditTitle")}
          color={t.text}
          onPress={() => {
            setEditAfterOptions(true);
            onCloseOptions();
          }}
        />
        <OptionRow
          icon={Archive}
          label={tSanta("settingsArchiveAction")}
          color={t.danger}
          onPress={confirmArchive}
        />
      </Sheet>
      <SecretSantaFormSheet
        visible={editing}
        title={tSanta("settingsEditTitle")}
        initial={draftFrom(secretSanta)}
        members={editableMembers}
        participantsLocked={drawn}
        busy={busy}
        submitLabel={tc("save")}
        onSubmit={submitEdit}
        onClose={() => setEditing(false)}
      />
      <ExclusionSheet
        visible={addingExclusion}
        secretSanta={secretSanta}
        onClose={() => setAddingExclusion(false)}
      />
    </ScrollView>
  );
}

/** The face-down card, then who the participant drew and their wishes. */
function Match({
  assignment,
}: {
  assignment: NonNullable<SecretSanta["assignment"]>;
}) {
  const tSanta = useTranslations("secretSanta");
  const [revealed, setRevealed] = useState(false);
  const name = assignment.name ?? tSanta("unnamedMember");
  return (
    <View style={{ gap: 16 }}>
      <RevealCard person={assignment} onRevealChange={setRevealed} />
      {revealed ? (
        <View style={{ gap: 10 }}>
          <Txt size={18} weight="700" style={{ textAlign: "center" }}>
            {tSanta("yourMatch", { name })}
          </Txt>
          <SectionTitle
            title={tSanta("giftIdeas")}
            count={
              assignment.giftIdeas.length > 0
                ? assignment.giftIdeas.length
                : undefined
            }
          />
          {assignment.giftIdeas.length === 0 ? (
            <Txt muted style={{ fontStyle: "italic" }}>
              {tSanta("matchIdeasIntro", { name })}
            </Txt>
          ) : (
            assignment.giftIdeas.map((giftIdea) => (
              <GiftIdeaRow key={giftIdea._id} giftIdea={giftIdea} />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function OptionRow({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon color={color} size={20} />
      <Txt size={16} style={{ color }}>
        {label}
      </Txt>
    </Pressable>
  );
}
