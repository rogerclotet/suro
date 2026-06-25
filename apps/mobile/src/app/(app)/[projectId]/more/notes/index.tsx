import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { headerCreateAction } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { notePreview } from "@/lib/note-content";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Fab,
  Field,
  Loading,
  Screen,
  Sheet,
  Txt,
  useFabScroll,
} from "@/ui";

type Note = FunctionReturnType<typeof api.notes.listByProject>[number];

const COLUMNS = 2;
const GAP = 12;
// Longest preview a card shows before clamping — also caps the height estimate
// used to balance the two columns.
const PREVIEW_LINES = 9;

/** A note with its computed plain-text preview and a rough height estimate. */
type Tile = { note: Note; preview: string; weight: number };

/** Estimate a card's height (in arbitrary units) to balance the masonry columns. */
function estimateWeight(name: string, preview: string): number {
  const titleLines = Math.min(2, Math.ceil(name.length / 18) || 1);
  const previewLines = Math.min(
    PREVIEW_LINES,
    preview === ""
      ? 0
      : preview
          .split("\n")
          .reduce(
            (sum, line) => sum + Math.max(1, Math.ceil(line.length / 22)),
            0,
          ),
  );
  return 64 + titleLines * 22 + previewLines * 18;
}

/** Greedily pack tiles into the shortest column so heights stay balanced. */
function packColumns(tiles: Tile[]): Tile[][] {
  const columns: Tile[][] = Array.from({ length: COLUMNS }, () => []);
  const heights = new Array<number>(COLUMNS).fill(0);
  for (const tile of tiles) {
    let shortest = 0;
    for (let i = 1; i < COLUMNS; i++) {
      if (heights[i] < heights[shortest]) {
        shortest = i;
      }
    }
    columns[shortest].push(tile);
    heights[shortest] += tile.weight + GAP;
  }
  return columns;
}

export default function NotesOverview() {
  const pid = useProjectId();
  const notes = usePersistentQuery(api.notes.listByProject, { projectId: pid });
  const [creating, setCreating] = useState(false);
  const fab = useFabScroll();
  const tNotes = useTranslations("mobile.notes");

  const columns = useMemo(() => {
    if (!notes) {
      return null;
    }
    const tiles = notes.map<Tile>((note) => {
      const preview = notePreview(note.contents, note.format);
      return { note, preview, weight: estimateWeight(note.name, preview) };
    });
    return packColumns(tiles);
  }, [notes]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tNotes("title"),
          ...headerCreateAction({
            onPress: () => setCreating(true),
            label: tNotes("newNote"),
          }),
        }}
      />
      {columns === null ? (
        <Loading />
      ) : columns.every((column) => column.length === 0) ? (
        <Txt muted style={{ paddingVertical: 40, textAlign: "center" }}>
          {tNotes("empty")}
        </Txt>
      ) : (
        // A masonry grid (variable-height paper cards) reads as notes far more
        // than uniform full-width rows. Note counts are modest, so a ScrollView
        // with two balanced columns beats wiring up a virtualized masonry list.
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onScroll={fab.onScroll}
          scrollEventThrottle={16}
        >
          <View style={{ flexDirection: "row", gap: GAP }}>
            {columns.map((column, index) => (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are a fixed, stable count
                key={index}
                style={{ flex: 1, gap: GAP }}
              >
                {column.map((tile) => (
                  <NoteCard key={tile.note._id} tile={tile} projectId={pid} />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Fab
        onPress={() => setCreating(true)}
        label={tNotes("newNote")}
        extended={fab.extended}
      />
      <CreateNoteSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
    </Screen>
  );
}

function NoteCard({
  tile,
  projectId,
}: {
  tile: Tile;
  projectId: Id<"projects">;
}) {
  const t = useTheme();
  const router = useRouter();
  const timeAgo = useTimeAgo();
  const { note, preview } = tile;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: `/${projectId}/more/notes/${note._id}`,
          params: { name: note.name },
        })
      }
      style={({ pressed }) => ({
        backgroundColor: t.card,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 6,
        opacity: pressed ? 0.92 : 1,
        // A soft lift so the cards feel like paper resting on the corkboard.
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          },
          android: { elevation: 2 },
        }),
      })}
    >
      <Txt size={16} weight="700" numberOfLines={2}>
        {note.name}
      </Txt>
      {preview ? (
        <Txt
          muted
          size={13}
          numberOfLines={PREVIEW_LINES}
          style={{ lineHeight: 18 }}
        >
          {preview}
        </Txt>
      ) : null}
      <Txt muted size={11} style={{ marginTop: 2 }}>
        {timeAgo(note.updatedAt)}
      </Txt>
    </Pressable>
  );
}

function CreateNoteSheet({
  visible,
  projectId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const create = useMutation(api.notes.create);
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const tNotes = useTranslations("mobile.notes");
  const tc = useTranslations("mobile.common");

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    try {
      const noteId = await create({ projectId, name: trimmed });
      setName("");
      onClose();
      router.push({
        pathname: `/${projectId}/more/notes/${noteId}`,
        params: { name: trimmed },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tNotes("newNote")}
      </Txt>
      <Field
        placeholder={tNotes("titlePlaceholder")}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Button
        title={busy ? tc("creating") : tNotes("createNote")}
        disabled={busy || name.trim().length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}
