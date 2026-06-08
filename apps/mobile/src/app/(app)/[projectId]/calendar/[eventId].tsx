import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Folders,
  Link2,
  ListPlus,
  ListTodo,
  Share2,
  Trash2,
  Unlink,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, View } from "react-native";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { FileGallery } from "@/components/file-gallery";
import { UploadButton } from "@/components/upload-button";
import { useLocale, useTranslations } from "@/i18n";
import { useFormatEventRange, useTimeRemaining } from "@/lib/datetime";
import { localizeGroupPath } from "@/lib/group-paths";
import { useProjectId } from "@/lib/project-id";
import { webUrl } from "@/lib/urls";
import { useUploadFile } from "@/lib/use-upload-file";
import { useTheme } from "@/theme";
import {
  Button,
  Card,
  IconAction,
  IconActionBar,
  Loading,
  Screen,
  Sheet,
  Txt,
} from "@/ui";

type EventResult = FunctionReturnType<typeof api.events.get>;
type ListWithItems = NonNullable<EventResult["list"]>;

export default function EventDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const pid = useProjectId();
  const eid = eventId as Id<"events">;
  const t = useTheme();
  const router = useRouter();
  const tCal = useTranslations("mobile.calendar");
  const tc = useTranslations("mobile.common");
  const locale = useLocale();
  const formatRange = useFormatEventRange();
  const timeRemaining = useTimeRemaining();

  const event = useQuery(api.events.get, { eventId: eid });
  const eventFiles = useQuery(api.files.listByEvent, { eventId: eid });
  const { pickImage, pickDocument, busy, pending } = useUploadFile(pid, eid);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);
  const createLinkedList = useMutation(api.events.createLinkedList);
  const unlinkList = useMutation(api.events.unlinkList);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [linking, setLinking] = useState(false);

  // Live countdown: refresh "now" each minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  async function handleCreateLinkedList() {
    setSettingsOpen(false);
    const listId = await createLinkedList({ eventId: eid });
    // Open within the calendar stack so Back returns to this event.
    router.push(`/${pid}/calendar/list/${listId}`);
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

  if (event === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const remaining = timeRemaining(event, now);
  const linkedList = event.list;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: event.name,
          headerRight: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
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
        <View>
          {remaining ? (
            <Txt size={14} style={{ color: t.primary, marginBottom: 2 }}>
              {remaining}
            </Txt>
          ) : null}
          <Txt muted size={14}>
            {formatRange(event)}
          </Txt>
        </View>

        {event.description ? <Txt size={15}>{event.description}</Txt> : null}

        {linkedList ? (
          <View style={{ gap: 8 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ListTodo color={t.text} size={18} />
              <Txt size={16} weight="700">
                {tCal("list")}
              </Txt>
            </View>
            <LinkedListCard
              list={linkedList}
              onPress={() =>
                // Open within the calendar stack so Back returns to this event.
                router.push({
                  pathname: `/${pid}/calendar/list/${linkedList._id}`,
                  params: { name: linkedList.name },
                })
              }
            />
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Folders color={t.text} size={18} />
              <Txt size={16} weight="700">
                {tCal("files")}
              </Txt>
            </View>
            <UploadButton picker={{ pickImage, pickDocument }} busy={busy} />
          </View>
          {(eventFiles && eventFiles.length > 0) || pending ? (
            <FileGallery
              files={eventFiles ?? []}
              pending={pending}
              showEventBadge={false}
            />
          ) : (
            <Txt muted size={13}>
              {tCal("noFilesAttached")}
            </Txt>
          )}
        </View>
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

      <Sheet visible={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Txt size={18} weight="700">
          {tCal("eventOptions")}
        </Txt>
        <Button
          title={tCal("editEvent")}
          onPress={() => {
            setSettingsOpen(false);
            setEditing(true);
          }}
        />
        {/* Secondary event actions as a compact icon toolbar. */}
        <IconActionBar>
          {linkedList ? (
            <IconAction
              icon={Unlink}
              caption={tCal("unlinkCaption")}
              label={tCal("unlinkList")}
              onPress={() => {
                setSettingsOpen(false);
                void unlinkList({ eventId: eid, listId: linkedList._id });
              }}
            />
          ) : (
            <>
              <IconAction
                icon={ListPlus}
                caption={tCal("createListCaption")}
                label={tCal("createList")}
                onPress={handleCreateLinkedList}
              />
              <IconAction
                icon={Link2}
                caption={tCal("linkListCaption")}
                label={tCal("linkExistingList")}
                onPress={() => {
                  setSettingsOpen(false);
                  setLinking(true);
                }}
              />
            </>
          )}
          <IconAction
            icon={Trash2}
            destructive
            caption={tCal("deleteCaption")}
            label={tCal("deleteEvent")}
            onPress={confirmDelete}
          />
        </IconActionBar>
      </Sheet>

      <LinkListSheet
        visible={linking}
        projectId={pid}
        eventId={eid}
        onClose={() => setLinking(false)}
      />
    </Screen>
  );
}

function LinkedListCard({
  list,
  onPress,
}: {
  list: ListWithItems;
  onPress: () => void;
}) {
  const tc = useTranslations("mobile.common");
  const done = list.items.filter((item) => item.completed).length;
  return (
    <Card onPress={onPress}>
      <Txt size={16} weight="700">
        {list.name}
      </Txt>
      <Txt muted size={13}>
        {list.items.length === 0
          ? tc("empty")
          : tc("itemsDone", { done, total: list.items.length })}
      </Txt>
    </Card>
  );
}

function LinkListSheet({
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
  const tCal = useTranslations("mobile.calendar");
  const lists = useQuery(api.lists.listByProject, { projectId });
  const linkList = useMutation(api.events.linkList);
  // Only lists not already linked to an event (mirrors the PWA filter).
  const available = (lists ?? []).filter((list) => !list.eventId);

  async function link(listId: Id<"lists">) {
    onClose();
    await linkList({ eventId, listId });
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tCal("linkAList")}
      </Txt>
      {available.length === 0 ? (
        <Txt muted style={{ paddingVertical: 8 }}>
          {tCal("noUnlinkedLists")}
        </Txt>
      ) : (
        <ScrollView style={{ maxHeight: 320 }}>
          {available.map((list) => (
            <Button
              key={list._id}
              title={list.name}
              variant="ghost"
              onPress={() => void link(list._id)}
            />
          ))}
        </ScrollView>
      )}
    </Sheet>
  );
}
