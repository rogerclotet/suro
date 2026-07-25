import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { NoteRichEditor } from "@/components/note-rich-editor";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { isBlankHtml, toEditorHtml } from "@/lib/note-content";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { FONT, useTheme } from "@/theme";
import { Button, HEADER_BUTTON_INSET, Loading, Screen, Txt } from "@/ui";

type Note = NonNullable<FunctionReturnType<typeof api.notes.get>>;

const SAVE_DEBOUNCE_MS = 700;

export default function NoteEditor() {
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
    return <DeletedNote />;
  }
  // Mount the editor only once the note has loaded so its initial content is
  // correct at first render; key by id so reactive note updates never remount
  // and clobber the user's cursor.
  return <NoteEditorContent key={id} id={id} note={note} />;
}

function DeletedNote() {
  const pid = useProjectId();
  const router = useRouter();
  const tNotes = useTranslations("mobile.notes");
  return (
    <Screen>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
        <Txt muted style={{ textAlign: "center" }}>
          {tNotes("notFound")}
        </Txt>
        <Button
          title={tNotes("title")}
          onPress={() => router.replace(`/${pid}/notes`)}
        />
      </View>
    </Screen>
  );
}

function NoteEditorContent({ id, note }: { id: Id<"notes">; note: Note }) {
  const pid = useProjectId();
  const update = useMutation(api.notes.update);
  const remove = useMutation(api.notes.remove);
  const router = useRouter();
  const t = useTheme();
  const tNotes = useTranslations("mobile.notes");
  const tc = useTranslations("mobile.common");
  const timeAgo = useTimeAgo();

  const [name, setName] = useState(note.name);
  const [html, setHtml] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Autosave (debounced) on real edits. The first HTML the editor emits is the
  // hydration baseline and must not trigger a write.
  const lastSaved = useRef<{ name: string; contents: string } | null>(null);
  const pending = useRef<{ name: string; contents: string } | null>(null);
  useEffect(() => {
    if (html === undefined) {
      return;
    }
    const trimmedName = name.trim();
    const contents = isBlankHtml(html) ? "" : html;
    if (lastSaved.current === null) {
      lastSaved.current = { name: note.name, contents };
      return;
    }
    if (
      trimmedName === "" ||
      (trimmedName === lastSaved.current.name &&
        contents === lastSaved.current.contents)
    ) {
      return;
    }
    pending.current = { name: trimmedName, contents };
    setStatus("saving");
    const handle = setTimeout(() => {
      void update({ noteId: id, name: trimmedName, contents, format: "html" })
        .then(() => {
          lastSaved.current = { name: trimmedName, contents };
          pending.current = null;
          setStatus("saved");
        })
        .catch(() => setStatus("idle"));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [name, html, id, note.name, update]);

  // Flush a still-pending edit if the screen unmounts before the debounce fires,
  // so navigating back quickly never drops the last change.
  useEffect(
    () => () => {
      const p = pending.current;
      if (p && p.name !== "") {
        void update({
          noteId: id,
          name: p.name,
          contents: p.contents,
          format: "html",
        });
      }
    },
    [id, update],
  );

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
            pending.current = null;
            void remove({ noteId: id }).then(() =>
              router.replace(`/${pid}/notes`),
            );
          },
        },
      ],
    );
  }

  const statusLabel =
    status === "saving"
      ? tNotes("saving")
      : status === "saved"
        ? tNotes("saved")
        : tNotes("updatedAt", { time: timeAgo(note.updatedAt) });

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: name || note.name,
          headerRight: () => (
            <Pressable
              onPress={confirmDelete}
              hitSlop={8}
              accessibilityLabel={tNotes("deleteTitle")}
              style={{ paddingHorizontal: HEADER_BUTTON_INSET }}
            >
              <Trash2 color={t.primary} size={20} />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 6,
          }}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={tNotes("titlePlaceholder")}
            placeholderTextColor={t.muted}
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: "700",
              color: t.text,
            }}
          />
          <Txt muted size={12}>
            {statusLabel}
          </Txt>
        </View>
        <NoteRichEditor
          content={toEditorHtml(note.contents, note.format)}
          placeholder={tNotes("contentsPlaceholder")}
          onChangeHtml={setHtml}
        />
      </View>
    </Screen>
  );
}
