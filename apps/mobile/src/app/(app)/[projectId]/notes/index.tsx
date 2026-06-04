import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useProjectId } from "@/lib/project-id";
import { timeAgo } from "@/lib/time-ago";
import { Button, Card, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

/** Plain-text preview, stripping tags from any migrated HTML notes. */
function preview(contents: string, format: string): string {
  const text = format === "html" ? contents.replace(/<[^>]*>/g, " ") : contents;
  return text.replace(/\s+/g, " ").trim();
}

export default function NotesOverview() {
  const pid = useProjectId();
  const notes = useQuery(api.notes.listByProject, { projectId: pid });
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <Screen>
      <Stack.Screen
        options={{ title: "Notes", ...sectionHeaderBadges("notes") }}
      />
      {notes === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(note) => note._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              No notes yet. Tap + to create one.
            </Txt>
          }
          renderItem={({ item }) => {
            const body = preview(item.contents, item.format);
            return (
              <Card onPress={() => router.push(`/${pid}/notes/${item._id}`)}>
                <Txt size={17} weight="700" numberOfLines={1}>
                  {item.name}
                </Txt>
                {body ? (
                  <Txt
                    muted
                    size={14}
                    numberOfLines={2}
                    style={{ marginTop: 4 }}
                  >
                    {body}
                  </Txt>
                ) : null}
                <Txt muted size={12} style={{ marginTop: 6 }}>
                  {timeAgo(item.updatedAt)}
                </Txt>
              </Card>
            );
          }}
        />
      )}
      <Fab onPress={() => setCreating(true)} />
      <CreateNoteSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
    </Screen>
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
      router.push(`/${projectId}/notes/${noteId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        New note
      </Txt>
      <Field
        placeholder="Title"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Button
        title={busy ? "Creating…" : "Create note"}
        disabled={busy || name.trim().length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}
