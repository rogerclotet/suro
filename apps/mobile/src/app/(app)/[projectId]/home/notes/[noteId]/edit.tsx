import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, TextInput, View } from "react-native";
import { NoteNotFound } from "@/components/note-not-found";
import { NoteRichEditor } from "@/components/note-rich-editor";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { isBlankHtml, toEditorHtml } from "@/lib/note-content";
import { useNoteEditLock } from "@/lib/use-note-edit-lock";
import { FONT, useTheme } from "@/theme";
import { Loading, Screen, Txt } from "@/ui";

type Note = NonNullable<FunctionReturnType<typeof api.notes.get>>;

const SAVE_DEBOUNCE_MS = 700;

export default function NoteEditor() {
  const { noteId, name: initialTitle } = useLocalSearchParams<{
    noteId: string;
    name?: string;
  }>();
  const { isAuthenticated } = useConvexAuth();
  const id = noteId as Id<"notes">;
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused && isAuthenticated ? (
    <LockedNoteEditor key={id} id={id} initialTitle={initialTitle} />
  ) : null;
}

function LockedNoteEditor({
  id,
  initialTitle,
}: {
  id: Id<"notes">;
  initialTitle?: string;
}) {
  const note = useQuery(api.notes.get, { noteId: id });
  const lock = useNoteEditLock(id);
  const tNotes = useTranslations("mobile.notes");

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
  // Mount the editor only once the note has loaded so its initial content is
  // correct at first render; key by id so reactive note updates never remount
  // and clobber the user's cursor.
  if (lock.kind !== "editing") {
    return (
      <Screen>
        <Stack.Screen options={{ title: note.name }} />
        <Txt style={{ padding: 16 }}>
          {tNotes(
            lock.kind === "loading"
              ? "startingEdit"
              : lock.kind === "error"
                ? "lockError"
                : "editingBySomeone",
          )}
        </Txt>
      </Screen>
    );
  }
  return (
    <NoteEditorContent
      key={id}
      id={id}
      note={{ ...note, ...lock.lease.note }}
      editLockId={lock.lease.lockId}
      canEdit={lock.valid}
    />
  );
}

function NoteEditorContent({
  id,
  note,
  editLockId,
  canEdit,
}: {
  id: Id<"notes">;
  note: Note;
  editLockId: Id<"noteEditLocks">;
  canEdit: boolean;
}) {
  const update = useMutation(api.notes.update);
  const t = useTheme();
  const tNotes = useTranslations("mobile.notes");
  const timeAgo = useTimeAgo();
  useEffect(() => {
    if (!canEdit) Keyboard.dismiss();
  }, [canEdit]);

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
      void update({
        noteId: id,
        editLockId,
        name: trimmedName,
        contents,
        format: "html",
      })
        .then(() => {
          lastSaved.current = { name: trimmedName, contents };
          if (
            pending.current?.name === trimmedName &&
            pending.current.contents === contents
          )
            pending.current = null;
          setStatus("saved");
        })
        .catch(() => setStatus("idle"));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [name, html, id, note.name, update, editLockId]);

  // Flush a still-pending edit if the screen unmounts before the debounce fires,
  // so navigating back quickly never drops the last change.
  useEffect(
    () => () => {
      const p = pending.current;
      if (p && p.name !== "") {
        void update({
          noteId: id,
          editLockId,
          name: p.name,
          contents: p.contents,
          format: "html",
        }).catch(() => {});
      }
    },
    [id, update, editLockId],
  );

  const statusLabel =
    status === "saving"
      ? tNotes("saving")
      : status === "saved"
        ? tNotes("saved")
        : tNotes("updatedAt", { time: timeAgo(note.updatedAt) });

  return (
    <Screen>
      <Stack.Screen options={{ title: name || note.name }} />
      {!canEdit && (
        <Txt accessibilityRole="alert" style={{ padding: 16 }}>
          {tNotes("lockLost")}
        </Txt>
      )}
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
            editable={canEdit}
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
          editable={canEdit}
          onChangeHtml={setHtml}
        />
      </View>
    </Screen>
  );
}
