import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  CirclePlus,
  FilePlus,
  FileText,
  ListPlus,
  ListTodo,
  type LucideIcon,
  Paperclip,
  Share2,
  Trash2,
  Unlink,
  Upload,
  Wallet,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Avatar } from "@/components/avatar";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { FileGallery } from "@/components/file-gallery";
import { chooseAndUpload } from "@/components/upload-button";
import { useLocale, useTranslations } from "@/i18n";
import { useFormatEventRange, useTimeRemaining } from "@/lib/datetime";
import { localizeGroupPath } from "@/lib/group-paths";
import { notePreview } from "@/lib/note-content";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { webUrl } from "@/lib/urls";
import { useUploadFile } from "@/lib/use-upload-file";
import { useTheme } from "@/theme";
import {
  Button,
  Card,
  HEADER_BUTTON_INSET,
  Loading,
  Screen,
  Sheet,
  Txt,
} from "@/ui";

type LinkKind = "list" | "note" | "pot";
type LinkCandidate = { kind: LinkKind; id: string; name: string };

/** The leading icon for each linkable kind — shared by cards and the picker. */
const KIND_ICON: Record<LinkKind, LucideIcon> = {
  list: ListTodo,
  note: FileText,
  pot: Wallet,
};

export default function EventDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const pid = useProjectId();
  const eid = eventId as Id<"events">;
  const t = useTheme();
  const router = useRouter();
  const tCal = useTranslations("mobile.calendar");
  const tFiles = useTranslations("mobile.files");
  const tc = useTranslations("mobile.common");
  const locale = useLocale();
  const formatRange = useFormatEventRange();
  const timeRemaining = useTimeRemaining();

  const event = usePersistentQuery(api.events.get, { eventId: eid });
  const eventFiles = usePersistentQuery(api.files.listByEvent, {
    eventId: eid,
  });
  const { pickImage, pickDocument, pending } = useUploadFile(pid, eid);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);
  const createLinkedList = useMutation(api.events.createLinkedList);
  const unlinkList = useMutation(api.events.unlinkList);
  const createLinkedNote = useMutation(api.events.createLinkedNote);
  const unlinkNote = useMutation(api.events.unlinkNote);
  const unlinkPot = useMutation(api.events.unlinkPot);
  const linkList = useMutation(api.events.linkList);
  const linkNote = useMutation(api.events.linkNote);
  const linkPot = useMutation(api.events.linkPot);

  // Existing records the event could still link — only the kinds it lacks.
  const candidates = useLinkCandidates(pid, {
    list: Boolean(event?.list),
    note: Boolean(event?.note),
    pot: Boolean(event?.pot),
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [potPicker, setPotPicker] = useState(false);
  // Presenting a second sheet while the options sheet is still animating out is
  // dropped on iOS, so defer it until the options sheet has fully closed.
  const [pendingSheet, setPendingSheet] = useState<
    null | "edit" | "link" | "pot"
  >(null);

  // Live countdown: refresh "now" each minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // `null` means the event no longer exists (deleted here or from another
  // client): return to the calendar instead of rendering — or re-querying — a
  // deleted event, which would surface an "Event not found" server error.
  useEffect(() => {
    if (event !== null) {
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/${pid}/calendar`);
    }
  }, [event, router, pid]);

  async function handleEdit(values: EventFormValues) {
    setEditing(false);
    await updateEvent({ eventId: eid, ...values });
  }

  function confirmDelete() {
    if (!event) {
      return;
    }
    const name = event.name;
    Alert.alert(tCal("deleteEvent"), tCal("deleteMessage", { name }), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: tc("delete"),
        style: "destructive",
        onPress: () => {
          setSettingsOpen(false);
          void removeEvent({ eventId: eid }).then(() => router.back());
        },
      },
    ]);
  }

  // Unlinking only detaches the record from the event; it isn't deleted, so the
  // confirm reassures rather than warns.
  function confirmUnlink(label: string, name: string, run: () => void) {
    Alert.alert(label, tCal("unlinkMessage", { name }), [
      { text: tc("cancel"), style: "cancel" },
      { text: tCal("unlink"), onPress: run },
    ]);
  }

  function chooseFile() {
    chooseAndUpload(
      { pickImage, pickDocument },
      {
        title: tFiles("sharePrompt"),
        photo: tFiles("photo"),
        document: tFiles("document"),
        cancel: tc("cancel"),
      },
    );
  }

  // Each "create" links a fresh record to the event and opens it within the
  // calendar stack so Back returns here rather than that section's own tab.
  async function handleCreateLinkedList() {
    const listId = await createLinkedList({ eventId: eid });
    router.push(`/${pid}/calendar/list/${listId}`);
  }

  async function handleCreateLinkedNote() {
    const noteId = await createLinkedNote({ eventId: eid });
    router.push(`/${pid}/calendar/note/${noteId}`);
  }

  // Pots ask who's in them first, so "create" just opens the member picker;
  // the sheet itself creates the pot and navigates to it.

  function linkExisting(candidate: LinkCandidate) {
    setLinking(false);
    if (candidate.kind === "list") {
      void linkList({ eventId: eid, listId: candidate.id as Id<"lists"> });
    } else if (candidate.kind === "note") {
      void linkNote({ eventId: eid, noteId: candidate.id as Id<"notes"> });
    } else {
      void linkPot({ eventId: eid, potId: candidate.id as Id<"pots"> });
    }
  }

  async function shareEvent() {
    if (!event) {
      return;
    }
    const link = webUrl(
      localizeGroupPath(`/groups/${pid}/calendar/${eid}`, locale),
    );
    // message carries the link for Android; url gives iOS its rich preview.
    const message = event.description
      ? `${event.name}\n\n${event.description}\n\n${link}`
      : `${event.name}\n\n${link}`;
    await Share.share({ title: event.name, message, url: link });
  }

  if (event === undefined || event === null) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "" }} />
        <Loading />
      </Screen>
    );
  }

  const remaining = timeRemaining(event, now);
  const linkedList = event.list;
  const linkedNote = event.note;
  const linkedPot = event.pot;
  // Pending uploads keep the gallery visible so the in-flight tile shows.
  const hasFiles = (eventFiles && eventFiles.length > 0) || pending;
  const hasExtras = Boolean(linkedList || linkedNote || linkedPot || hasFiles);
  // Quiet prompts for whatever the event still lacks, so the menu's add
  // actions are discoverable without opening it. Skipped entirely when full,
  // so the ScrollView gap doesn't show phantom spacing.
  const showAddChips =
    !linkedList ||
    !linkedNote ||
    !linkedPot ||
    !hasFiles ||
    candidates.length > 0;

  // Auto-created linked records inherit the event's name (events.createLinked*);
  // repeating it right under the headline is noise, so show the kind instead.
  const kindOrName = (name: string, kindLabel: string) =>
    name === event.name ? kindLabel : name;

  function runPendingSheet() {
    if (pendingSheet === "edit") {
      setEditing(true);
    } else if (pendingSheet === "link") {
      setLinking(true);
    } else if (pendingSheet === "pot") {
      setPotPicker(true);
    }
    setPendingSheet(null);
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          // The event name is the page's headline below (as in Apple/Google
          // Calendar); a header title would truncate long names.
          title: "",
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                paddingHorizontal: HEADER_BUTTON_INSET,
              }}
            >
              <Pressable onPress={shareEvent} hitSlop={8}>
                <Share2 color={t.primary} size={20} />
              </Pressable>
              <Pressable onPress={() => setSettingsOpen(true)} hitSlop={8}>
                <Txt size={20} style={{ color: t.primary }}>
                  ⋯
                </Txt>
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Txt size={26} weight="700">
            {event.name}
          </Txt>
          <Txt muted size={16}>
            {formatRange(event)}
          </Txt>
          {remaining ? (
            <Txt size={15} style={{ color: t.primary }}>
              {remaining}
            </Txt>
          ) : null}
        </View>

        {event.description ? <Txt size={18}>{event.description}</Txt> : null}

        {hasExtras ? (
          <>
            {/* Divider sets the event off from the extras attached to it. */}
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: t.border,
                marginVertical: 4,
              }}
            />
            {linkedList ? (
              <LinkedCard
                icon={ListTodo}
                name={kindOrName(linkedList.name, tCal("list"))}
                subtitle={
                  linkedList.items.length === 0
                    ? tc("empty")
                    : tc("itemsDone", {
                        done: linkedList.items.filter((i) => i.completed)
                          .length,
                        total: linkedList.items.length,
                      })
                }
                unlinkLabel={tCal("unlinkList")}
                onPress={() =>
                  router.push({
                    pathname: `/${pid}/calendar/list/${linkedList._id}`,
                    params: { name: linkedList.name },
                  })
                }
                onUnlink={() =>
                  confirmUnlink(
                    tCal("unlinkList"),
                    linkedList.name,
                    () =>
                      void unlinkList({ eventId: eid, listId: linkedList._id }),
                  )
                }
              />
            ) : null}
            {linkedNote ? (
              <LinkedCard
                icon={FileText}
                name={kindOrName(linkedNote.name, tCal("note"))}
                subtitle={
                  notePreview(linkedNote.contents, linkedNote.format) ||
                  tc("empty")
                }
                unlinkLabel={tCal("unlinkNote")}
                onPress={() =>
                  router.push({
                    pathname: `/${pid}/calendar/note/${linkedNote._id}`,
                    params: { name: linkedNote.name },
                  })
                }
                onUnlink={() =>
                  confirmUnlink(
                    tCal("unlinkNote"),
                    linkedNote.name,
                    () =>
                      void unlinkNote({ eventId: eid, noteId: linkedNote._id }),
                  )
                }
              />
            ) : null}
            {linkedPot ? (
              <LinkedCard
                icon={Wallet}
                name={kindOrName(linkedPot.name, tCal("expense"))}
                subtitle={tc("memberCount", { count: linkedPot.memberCount })}
                unlinkLabel={tCal("unlinkExpense")}
                onPress={() =>
                  router.push({
                    pathname: `/${pid}/calendar/expense/${linkedPot._id}`,
                    params: { name: linkedPot.name },
                  })
                }
                onUnlink={() =>
                  confirmUnlink(
                    tCal("unlinkExpense"),
                    linkedPot.name,
                    () =>
                      void unlinkPot({ eventId: eid, potId: linkedPot._id }),
                  )
                }
              />
            ) : null}
            {hasFiles ? (
              <FileGallery
                files={eventFiles ?? []}
                pending={pending}
                showEventBadge={false}
              />
            ) : null}
          </>
        ) : null}

        {showAddChips ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {!linkedList ? (
              <AddChip
                icon={ListPlus}
                label={tCal("createList")}
                onPress={() => void handleCreateLinkedList()}
              />
            ) : null}
            {!linkedNote ? (
              <AddChip
                icon={FilePlus}
                label={tCal("createNote")}
                onPress={() => void handleCreateLinkedNote()}
              />
            ) : null}
            {!linkedPot ? (
              <AddChip
                icon={CirclePlus}
                label={tCal("createExpense")}
                onPress={() => setPotPicker(true)}
              />
            ) : null}
            {!hasFiles ? (
              <AddChip
                icon={Upload}
                label={tFiles("uploadFile")}
                onPress={chooseFile}
              />
            ) : null}
            {candidates.length > 0 ? (
              <AddChip
                icon={Paperclip}
                label={tCal("addExisting")}
                onPress={() => setLinking(true)}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <EventForm
        visible={editing}
        initial={{
          name: event.name,
          description: event.description ?? "",
          startAt: event.startAt,
          endAt: event.endAt,
          allDay: event.allDay,
        }}
        title={tCal("editEvent")}
        onSubmit={handleEdit}
        onClose={() => setEditing(false)}
      />

      <Sheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClosed={runPendingSheet}
      >
        <Txt size={18} weight="700">
          {tCal("eventOptions")}
        </Txt>
        <Button
          title={tCal("editEvent")}
          onPress={() => {
            setPendingSheet("edit");
            setSettingsOpen(false);
          }}
        />
        {/* Add-to-event actions: create a new record of a kind not yet linked,
            attach an existing one, or upload a file. */}
        {!linkedList ? (
          <SheetAction
            icon={ListPlus}
            label={tCal("createList")}
            onPress={() => {
              setSettingsOpen(false);
              void handleCreateLinkedList();
            }}
          />
        ) : null}
        {!linkedNote ? (
          <SheetAction
            icon={FilePlus}
            label={tCal("createNote")}
            onPress={() => {
              setSettingsOpen(false);
              void handleCreateLinkedNote();
            }}
          />
        ) : null}
        {!linkedPot ? (
          <SheetAction
            icon={CirclePlus}
            label={tCal("createExpense")}
            onPress={() => {
              setPendingSheet("pot");
              setSettingsOpen(false);
            }}
          />
        ) : null}
        {candidates.length > 0 ? (
          <SheetAction
            icon={Paperclip}
            label={tCal("addExisting")}
            onPress={() => {
              setPendingSheet("link");
              setSettingsOpen(false);
            }}
          />
        ) : null}
        <SheetAction
          icon={Upload}
          label={tFiles("uploadFile")}
          onPress={() => {
            setSettingsOpen(false);
            chooseFile();
          }}
        />
        <SheetAction
          icon={Trash2}
          destructive
          label={tCal("deleteEvent")}
          onPress={confirmDelete}
        />
      </Sheet>

      <LinkExistingSheet
        visible={linking}
        title={tCal("addExisting")}
        emptyLabel={tCal("noneToAdd")}
        typeLabel={(kind) =>
          kind === "list"
            ? tCal("list")
            : kind === "note"
              ? tCal("note")
              : tCal("expense")
        }
        candidates={candidates}
        onPick={linkExisting}
        onClose={() => setLinking(false)}
      />

      <CreatePotMembersSheet
        visible={potPicker}
        projectId={pid}
        eventId={eid}
        onClose={() => setPotPicker(false)}
      />
    </Screen>
  );
}

/**
 * Picks who's in a new event-linked pot before creating it. Defaults to every
 * group member selected (the prior auto-seed behaviour) but lets the user trim
 * the list. The pot inherits the event's name, so there's no name field here.
 */
function CreatePotMembersSheet({
  visible,
  projectId,
  eventId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  eventId: Id<"events">;
  onClose: () => void;
}) {
  const members = usePersistentQuery(api.projects.members, { projectId });
  const createLinkedPot = useMutation(api.events.createLinkedPot);
  const router = useRouter();
  const t = useTheme();
  const tExp = useTranslations("mobile.expenses");
  const tCal = useTranslations("mobile.calendar");
  const tc = useTranslations("mobile.common");
  // `null` means untouched — everyone is selected until the user changes it.
  const [selected, setSelected] = useState<Set<Id<"users">> | null>(null);
  const [busy, setBusy] = useState(false);

  const allIds = useMemo(
    () => new Set((members ?? []).map((m) => m._id)),
    [members],
  );
  const chosen = selected ?? allIds;

  function toggle(userId: Id<"users">) {
    const next = new Set(chosen);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelected(next);
  }

  async function submit() {
    if (chosen.size < 2) {
      return;
    }
    setBusy(true);
    try {
      const potId = await createLinkedPot({
        eventId,
        memberIds: [...chosen],
      });
      setSelected(null);
      onClose();
      router.push(`/${projectId}/calendar/expense/${potId}`);
    } finally {
      setBusy(false);
    }
  }

  // Expenses are a group feature; a solo group can't make a pot.
  const tooFew = members !== undefined && members.length < 2;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tExp("choosePotMembers")}
      </Txt>
      {members === undefined ? (
        <Loading />
      ) : tooFew ? (
        <Txt muted style={{ paddingVertical: 8 }}>
          {tCal("expenseNeedsMembers")}
        </Txt>
      ) : (
        <>
          <Txt muted size={13}>
            {tExp("members", { count: chosen.size })}
          </Txt>
          <ScrollView
            style={{ maxHeight: 260 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {members.map((member) => {
              const on = chosen.has(member._id);
              return (
                <Pressable
                  key={member._id}
                  onPress={() => toggle(member._id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderWidth: 1,
                    borderColor: on ? t.primary : t.border,
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <Avatar
                    name={member.name}
                    image={member.image}
                    color={member.avatarColor}
                    size={28}
                  />
                  <Txt style={{ flex: 1 }} numberOfLines={1}>
                    {member.name ?? tc("member")}
                  </Txt>
                  {on ? (
                    <Txt weight="700" style={{ color: t.primary }}>
                      ✓
                    </Txt>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Button
            title={busy ? tc("creating") : tExp("createPot")}
            disabled={busy || chosen.size < 2}
            onPress={submit}
          />
        </>
      )}
    </Sheet>
  );
}

/**
 * The unlinked records the event could still attach, across the kinds it
 * doesn't already have. Queries for an already-linked kind are skipped.
 */
function useLinkCandidates(
  projectId: Id<"projects">,
  linked: { list: boolean; note: boolean; pot: boolean },
): LinkCandidate[] {
  const lists = usePersistentQuery(
    api.lists.listByProject,
    linked.list ? "skip" : { projectId },
  );
  const notes = usePersistentQuery(
    api.notes.listByProject,
    linked.note ? "skip" : { projectId },
  );
  const pots = usePersistentQuery(
    api.expenses.listPots,
    linked.pot ? "skip" : { projectId },
  );
  return useMemo(() => {
    const out: LinkCandidate[] = [];
    if (!linked.list) {
      for (const list of lists ?? []) {
        if (!list.eventId) {
          out.push({ kind: "list", id: list._id, name: list.name });
        }
      }
    }
    if (!linked.note) {
      for (const note of notes ?? []) {
        if (!note.eventId) {
          out.push({ kind: "note", id: note._id, name: note.name });
        }
      }
    }
    if (!linked.pot) {
      for (const pot of pots ?? []) {
        if (!pot.eventId) {
          out.push({ kind: "pot", id: pot._id, name: pot.name });
        }
      }
    }
    return out;
  }, [lists, notes, pots, linked.list, linked.note, linked.pot]);
}

/**
 * A muted dashed pill prompting an add-to-event action — quiet enough to fill
 * the empty space without competing with the event's own content.
 */
function AddChip({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: t.border,
        borderRadius: 999,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon color={t.muted} size={14} />
      <Txt muted size={13}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** A left-aligned icon + label row for the event-options sheet. */
function SheetAction({
  icon: Icon,
  label,
  onPress,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const t = useTheme();
  const color = destructive ? t.danger : t.text;
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

/** A linked record: kind icon, tap the body to open it, trailing icon to unlink. */
function LinkedCard({
  icon: Icon,
  name,
  subtitle,
  onPress,
  onUnlink,
  unlinkLabel,
}: {
  icon: LucideIcon;
  name: string;
  subtitle: string;
  onPress: () => void;
  onUnlink: () => void;
  unlinkLabel: string;
}) {
  const t = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon color={t.text} size={20} />
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
        >
          <Txt size={16} weight="700">
            {name}
          </Txt>
          <Txt muted size={13} numberOfLines={2}>
            {subtitle}
          </Txt>
        </Pressable>
        <Pressable
          onPress={onUnlink}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={unlinkLabel}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Unlink color={t.muted} size={18} />
        </Pressable>
      </View>
    </Card>
  );
}

/**
 * Unified "add existing" picker: one list of every unlinked record across the
 * kinds the event doesn't already have, each row tagged with its kind.
 */
function LinkExistingSheet({
  visible,
  title,
  emptyLabel,
  typeLabel,
  candidates,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  emptyLabel: string;
  typeLabel: (kind: LinkKind) => string;
  candidates: LinkCandidate[];
  onPick: (candidate: LinkCandidate) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {title}
      </Txt>
      {candidates.length === 0 ? (
        <Txt muted style={{ paddingVertical: 8 }}>
          {emptyLabel}
        </Txt>
      ) : (
        <ScrollView style={{ maxHeight: 320 }}>
          {candidates.map((candidate, index) => {
            const Icon = KIND_ICON[candidate.kind];
            return (
              <Pressable
                key={`${candidate.kind}:${candidate.id}`}
                onPress={() => onPick(candidate)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 14,
                  borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: t.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Icon color={t.muted} size={18} />
                <Txt size={16} style={{ flex: 1 }} numberOfLines={1}>
                  {candidate.name}
                </Txt>
                <Txt muted size={12}>
                  {typeLabel(candidate.kind)}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Sheet>
  );
}
