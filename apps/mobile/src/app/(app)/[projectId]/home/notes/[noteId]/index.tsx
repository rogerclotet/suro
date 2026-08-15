import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Stack,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import { Alert, View } from "react-native";
import {
  type HeaderAction,
  headerCreateAction,
} from "@/components/header-badges";
import { NoteHtmlView } from "@/components/note-html-view";
import { NoteNotFound } from "@/components/note-not-found";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { notePreview } from "@/lib/note-content";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { Fab, Loading, Screen, Txt } from "@/ui";

type Note = NonNullable<FunctionReturnType<typeof api.notes.get>>;

/**
 * The note reading screen: the rendered note with tappable links. Editing is a
 * deliberate step away (the FAB on Android, the header pencil on iOS) so opening
 * a note never lands the reader in an editor with the keyboard rising.
 */
export default function NoteScreen() {
  const { noteId, name: initialTitle } = useLocalSearchParams<{
    noteId: string;
    name?: string;
  }>();
  const id = noteId as Id<"notes">;
  const note = usePersistentQuery(api.notes.get, { noteId: id });

  if (note === undefined) {
    return (
      <Screen>
        {/* Use the name passed at navigation time so the header never flashes
            the "[noteId]" route segment while the note query resolves. */}
        <Stack.Screen options={{ title: initialTitle ?? "" }} />
        <Loading />
      </Screen>
    );
  }
  if (note === null) {
    return <NoteNotFound />;
  }
  return <NoteContent id={id} note={note} />;
}

function NoteContent({ id, note }: { id: Id<"notes">; note: Note }) {
  const pid = useProjectId();
  const pathname = usePathname();
  const router = useRouter();
  const remove = useMutation(api.notes.remove);
  const tNotes = useTranslations("mobile.notes");
  const tc = useTranslations("mobile.common");
  const timeAgo = useTimeAgo();

  // The same screen is mounted in the notes stack and in the calendar stack
  // (see calendar/note/[noteId]), so derive the editor route from where we are
  // rather than hard-coding one of the two paths.
  function edit() {
    router.push(`${pathname}/edit`);
  }

  function confirmDelete() {
    Alert.alert(
      tNotes("deleteTitle"),
      tNotes("deleteMessage", { name: note.name || tNotes("thisNote") }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            void remove({ noteId: id }).then(() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace(`/${pid}/home/notes`);
            });
          },
        },
      ],
    );
  }

  const deleteAction: HeaderAction = {
    icon: Trash2,
    onPress: confirmDelete,
    label: tNotes("deleteTitle"),
  };

  const isEmpty = notePreview(note.contents, note.format) === "";

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: note.name,
          // iOS gets the pencil in the header capsule; on Android it's the Fab.
          ...headerCreateAction(
            { onPress: edit, label: tc("edit"), icon: Pencil },
            [deleteAction],
          ),
        }}
      />
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 6,
        }}
      >
        <Txt size={22} weight="700">
          {note.name}
        </Txt>
        <Txt muted size={12}>
          {tNotes("updatedAt", { time: timeAgo(note.updatedAt) })}
        </Txt>
      </View>
      {isEmpty ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
          <Txt muted>{tNotes("emptyNote")}</Txt>
        </View>
      ) : (
        <NoteHtmlView contents={note.contents} format={note.format} />
      )}
      <Fab onPress={edit} icon={Pencil} label={tc("edit")} />
    </Screen>
  );
}
