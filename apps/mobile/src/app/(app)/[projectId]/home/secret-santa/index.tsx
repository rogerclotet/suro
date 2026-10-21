import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { eventLocalStart } from "domain/events";
import { MIN_PARTICIPANTS_FOR_EXCLUSIONS } from "domain/secret-santa";
import { Stack, useRouter } from "expo-router";
import {
  Archive,
  CalendarDays,
  Ellipsis,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import {
  headerBackAction,
  headerCreateAction,
} from "@/components/header-badges";
import { secretSantaErrorMessage } from "@/features/secret-santa/errors";
import { ExclusionSheet } from "@/features/secret-santa/exclusion-sheet";
import { SecretSantaFormSheet } from "@/features/secret-santa/form-sheet";
import {
  draftFrom,
  exchangeFromDraft,
  newDraft,
  priceRangeFromDraft,
  type SecretSantaDraft,
} from "@/features/secret-santa/form-values";
import { GiftIdeaRow } from "@/features/secret-santa/gift-idea-row";
import { PersonTile } from "@/features/secret-santa/person-tile";
import { RevealCard } from "@/features/secret-santa/reveal-card";
import type { Person, SecretSanta } from "@/features/secret-santa/types";
import { useLocale, useTranslations } from "@/i18n";
import { useTimeRemaining } from "@/lib/datetime";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Card, Loading, Screen, Sheet, Txt } from "@/ui";

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
          ...(secretSanta?.canOrganize
            ? headerCreateAction(undefined, [
                {
                  icon: Ellipsis,
                  onPress: () => setOptionsOpen(true),
                  label: tSanta("settingsTitle"),
                },
              ])
            : {}),
        }}
      />
      {secretSanta === undefined || members === undefined ? (
        <Loading />
      ) : secretSanta === null ? (
        <EmptyState projectId={pid} members={members} />
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

function EmptyState({
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

  if (members.length < 2) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <View style={{ gap: 8 }}>
            <Txt>{tSanta("infoDescription")}</Txt>
            <Txt muted>{tSanta("description")}</Txt>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Card>
        <View style={{ gap: 8 }}>
          <Txt size={18} weight="700">
            {tSanta("emptyTitle")}
          </Txt>
          <Txt muted>{tSanta("description")}</Txt>
          <Txt muted>{tSanta("emptyMessage")}</Txt>
        </View>
      </Card>
      <Button
        title={tSanta("createAction")}
        onPress={() => setCreating(true)}
      />
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
  const draw = useMutation(api.secretSantas.draw);
  const removeExclusion = useMutation(api.secretSantas.removeExclusion);
  const [editing, setEditing] = useState(false);
  const [addingExclusion, setAddingExclusion] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const drawn = secretSanta.drawnAt !== null;
  const editableExclusions = secretSanta.canOrganize && !drawn;

  // Members who left after the draw still take part, so list them too.
  const memberIds = new Set(members.map((member) => member.userId));
  const editableMembers = [
    ...members,
    ...secretSanta.participants.filter(
      (participant) => !memberIds.has(participant.userId),
    ),
  ];

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

  function confirmDraw() {
    Alert.alert(tSanta("drawTitle"), tSanta("drawDescription"), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: tSanta("drawAction"),
        onPress: () => {
          draw({ secretSantaId: secretSanta._id }).catch((error: unknown) =>
            Alert.alert(
              secretSantaErrorMessage(error, tSanta) ?? tSanta("drawError"),
            ),
          );
        },
      },
    ]);
  }

  function confirmRemoveExclusion(exclusion: Id<"users">[]) {
    const names = exclusion
      .map(
        (id) =>
          secretSanta.participants.find((p) => p.userId === id)?.name ??
          tSanta("unnamedMember"),
      )
      .join(", ");
    Alert.alert(
      tSanta("exclusionDeleteTitle", { names }),
      tSanta("exclusionDeleteDescription"),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            removeExclusion({
              secretSantaId: secretSanta._id,
              userIds: exclusion,
            }).catch(() => Alert.alert(tSanta("exclusionDeleteError")));
          },
        },
      ],
    );
  }

  const ideasButton = secretSanta.isParticipant ? (
    <Button
      title={tSanta("myIdeasAction")}
      variant="ghost"
      onPress={() => router.push(`/${pid}/home/secret-santa/ideas`)}
    />
  ) : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
    >
      <InfoCard secretSanta={secretSanta} />

      {drawn && secretSanta.assignment ? (
        <>
          <RevealCard
            person={secretSanta.assignment}
            onRevealChange={setRevealed}
          />
          {revealed ? (
            <View style={{ gap: 8 }}>
              <Txt size={18} weight="700">
                {tSanta("yourMatch", {
                  name: secretSanta.assignment.name ?? tSanta("unnamedMember"),
                })}
              </Txt>
              <Txt size={16} weight="700">
                {tSanta("giftIdeas")}
              </Txt>
              {secretSanta.assignment.giftIdeas.length === 0 ? (
                <Txt muted style={{ fontStyle: "italic" }}>
                  {tSanta("matchIdeasIntro", {
                    name:
                      secretSanta.assignment.name ?? tSanta("unnamedMember"),
                  })}
                </Txt>
              ) : (
                secretSanta.assignment.giftIdeas.map((giftIdea) => (
                  <GiftIdeaRow key={giftIdea._id} giftIdea={giftIdea} />
                ))
              )}
            </View>
          ) : null}
          {ideasButton}
        </>
      ) : (
        <>
          <Txt muted>
            {drawn
              ? tSanta("notParticipating")
              : secretSanta.isParticipant
                ? tSanta("waitingForDraw")
                : tSanta("notParticipatingYet")}
          </Txt>
          {ideasButton}

          <Txt size={18} weight="700">
            {tSanta("participants")}
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {secretSanta.participants.map((person) => (
              <PersonTile key={person.userId} person={person} />
            ))}
          </View>

          {secretSanta.participants.length >= MIN_PARTICIPANTS_FOR_EXCLUSIONS &&
          (editableExclusions || secretSanta.exclusions.length > 0) ? (
            <View style={{ gap: 8 }}>
              <Txt size={18} weight="700">
                {tSanta("exclusionsTitle")}
              </Txt>
              <Txt muted size={14}>
                {tSanta("exclusionsDescription")}
              </Txt>
              {secretSanta.exclusions.map((exclusion) => (
                <ExclusionRow
                  key={exclusion.join("-")}
                  exclusion={exclusion}
                  participants={secretSanta.participants}
                  onRemove={
                    editableExclusions
                      ? () => confirmRemoveExclusion(exclusion)
                      : undefined
                  }
                />
              ))}
              {editableExclusions ? (
                <Button
                  title={tSanta("exclusionCreateAction")}
                  variant="ghost"
                  onPress={() => setAddingExclusion(true)}
                />
              ) : null}
            </View>
          ) : null}

          {secretSanta.canOrganize && !drawn ? (
            <Button title={tSanta("drawAction")} onPress={confirmDraw} />
          ) : null}
        </>
      )}

      <Sheet visible={optionsOpen} onClose={onCloseOptions}>
        <Txt size={18} weight="700">
          {secretSanta.name}
        </Txt>
        <OptionRow
          icon={Pencil}
          label={tSanta("settingsEditTitle")}
          color={t.text}
          onPress={() => {
            onCloseOptions();
            setEditing(true);
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

function InfoCard({ secretSanta }: { secretSanta: SecretSanta }) {
  const t = useTheme();
  const pid = useProjectId();
  const router = useRouter();
  const locale = useLocale();
  const tSanta = useTranslations("secretSanta");
  const timeRemaining = useTimeRemaining();
  const times = {
    startAt: secretSanta.exchangeAt,
    endAt: secretSanta.exchangeAt,
    allDay: secretSanta.exchangeAllDay,
  };
  const remaining = timeRemaining(times, Date.now());
  const when = eventLocalStart(times).toLocaleString(
    locale,
    secretSanta.exchangeAllDay
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
  );
  const { min, max } = secretSanta.priceRange;
  const { eventId } = secretSanta;

  return (
    <Card>
      <View style={{ gap: 6 }}>
        <Txt size={22} weight="700">
          {secretSanta.name}
        </Txt>
        {secretSanta.description ? (
          <Txt muted>{secretSanta.description}</Txt>
        ) : null}
        {remaining ? (
          <Txt size={14} weight="700" style={{ color: t.primary }}>
            {remaining}
          </Txt>
        ) : null}
        <Txt size={14}>{when}</Txt>
        {max > 0 ? (
          <Txt muted size={14}>
            {min > 0
              ? tSanta("priceRangeValue", { min, max })
              : tSanta("priceRangeUpTo", { max })}
          </Txt>
        ) : null}
        {secretSanta.organizerName ? (
          <Txt muted size={14}>
            {tSanta("organizedBy", { name: secretSanta.organizerName })}
          </Txt>
        ) : null}
        {eventId ? (
          <Pressable
            onPress={() => router.navigate(`/${pid}/calendar/${eventId}`)}
            accessibilityRole="link"
            hitSlop={6}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <CalendarDays color={t.primary} size={16} />
            <Txt size={14} weight="700" style={{ color: t.primary }}>
              {tSanta("viewInCalendar")}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function ExclusionRow({
  exclusion,
  participants,
  onRemove,
}: {
  exclusion: Id<"users">[];
  participants: Person[];
  onRemove?: () => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const people = exclusion.map((id) =>
    participants.find((participant) => participant.userId === id),
  );
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flexDirection: "row" }}>
          {people.map((person, index) => (
            <Avatar
              key={person?.userId ?? index}
              kind="user"
              name={person?.name}
              image={person?.image}
              color={person?.avatarColor}
              size={28}
              style={index > 0 ? { marginLeft: -8 } : undefined}
            />
          ))}
        </View>
        <Txt style={{ flex: 1 }} numberOfLines={2}>
          {people
            .map((person) => person?.name ?? tSanta("unnamedMember"))
            .join(", ")}
        </Txt>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tc("delete")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Trash2 color={t.danger} size={18} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function OptionRow({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: typeof Pencil;
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
