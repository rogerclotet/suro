import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Folders, ListTodo, Share2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, View } from "react-native";
import type { EventFormValues } from "@/components/event-form";
import { EventForm } from "@/components/event-form";
import { FileList } from "@/components/file-list";
import { UploadButton } from "@/components/upload-button";
import { useTranslations } from "@/i18n";
import { useFormatEventRange, useTimeRemaining } from "@/lib/datetime";
import { useProjectId } from "@/lib/project-id";
import { webUrl } from "@/lib/urls";
import { useTheme } from "@/theme";
import { Button, Card, Loading, Screen, Sheet, Txt } from "@/ui";

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
  const formatRange = useFormatEventRange();
  const timeRemaining = useTimeRemaining();

  const event = useQuery(api.events.get, { eventId: eid });
  const eventFiles = useQuery(api.files.listByEvent, { eventId: eid });
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
    router.push(`/${pid}/lists/${listId}`);
  }

  async function shareEvent() {
    if (!event) {
      return;
    }
    const link = webUrl(`/groups/${pid}/calendar/${eid}`);
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
              onPress={() => router.push(`/${pid}/lists/${linkedList._id}`)}
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
            <UploadButton projectId={pid} eventId={eid} />
          </View>
          {eventFiles && eventFiles.length > 0 ? (
            <FileList files={eventFiles} />
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
        {linkedList ? (
          <Button
            title={tCal("unlinkList")}
            variant="ghost"
            onPress={() => {
              setSettingsOpen(false);
              void unlinkList({ eventId: eid, listId: linkedList._id });
            }}
          />
        ) : (
          <>
            <Button
              title={tCal("createList")}
              onPress={handleCreateLinkedList}
            />
            <Button
              title={tCal("linkExistingList")}
              variant="ghost"
              onPress={() => {
                setSettingsOpen(false);
                setLinking(true);
              }}
            />
          </>
        )}
        <Pressable onPress={confirmDelete} style={{ padding: 10 }}>
          <Txt style={{ textAlign: "center", color: "#e64553" }}>
            {tCal("deleteEvent")}
          </Txt>
        </Pressable>
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
