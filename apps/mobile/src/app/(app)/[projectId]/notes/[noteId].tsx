import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useProjectId } from "@/lib/project-id";
import { timeAgo } from "@/lib/time-ago";
import { FONT, useTheme } from "@/theme";
import { HEADER_BUTTON_INSET, Loading, Screen, Txt } from "@/ui";

function stripHtml(contents: string): string {
  return contents
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NoteEditor() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const id = noteId as Id<"notes">;
  const pid = useProjectId();
  const note = useQuery(api.notes.get, { noteId: id });
  const update = useMutation(api.notes.update);
  const remove = useMutation(api.notes.remove);
  const router = useRouter();
  const t = useTheme();

  const [name, setName] = useState("");
  const [contents, setContents] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const hydrated = useRef(false);

  // Hydrate once from the server; HTML notes (from migration) become plain text.
  useEffect(() => {
    if (note && !hydrated.current) {
      setName(note.name);
      setContents(
        note.format === "html" ? stripHtml(note.contents) : note.contents,
      );
      hydrated.current = true;
    }
  }, [note]);

  // Debounced autosave after the user edits (never on the initial hydrate).
  useEffect(() => {
    if (!dirty || name.trim() === "") {
      return;
    }
    const handle = setTimeout(() => {
      void update({ noteId: id, name: name.trim(), contents }).then(() =>
        setSaved(true),
      );
    }, 700);
    return () => clearTimeout(handle);
  }, [dirty, name, contents, id, update]);

  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setDirty(true);
      setSaved(false);
    };
  }

  function confirmDelete() {
    Alert.alert("Delete note", `Delete "${note?.name ?? "this note"}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void remove({ noteId: id }).then(() =>
            router.replace(`/${pid}/notes`),
          );
        },
      },
    ]);
  }

  if (note === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: note.name,
          headerRight: () => (
            <Pressable
              onPress={confirmDelete}
              hitSlop={8}
              accessibilityLabel="Delete note"
              style={{ paddingHorizontal: HEADER_BUTTON_INSET }}
            >
              <Trash2 color={t.primary} size={20} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1, padding: 16, gap: 8 }}>
          <TextInput
            value={name}
            onChangeText={edit(setName)}
            placeholder="Title"
            placeholderTextColor={t.muted}
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: "700",
              color: t.text,
            }}
          />
          <Txt muted size={12}>
            {dirty
              ? saved
                ? "Saved"
                : "Saving…"
              : `Updated ${timeAgo(note.updatedAt)}`}
          </Txt>
          <TextInput
            value={contents}
            onChangeText={edit(setContents)}
            placeholder="Write something…"
            placeholderTextColor={t.muted}
            multiline
            textAlignVertical="top"
            style={{
              flex: 1,
              fontFamily: FONT,
              fontSize: 16,
              color: t.text,
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
