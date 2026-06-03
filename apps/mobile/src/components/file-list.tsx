import { api } from "backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Calendar, File as FileIcon, FileText } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Linking, Pressable, View } from "react-native";
import { isImage, isPdf, readableSize } from "@/lib/files";
import { useTheme } from "@/theme";
import { Button, Field, Sheet, Txt } from "@/ui";

type ProjectFile = FunctionReturnType<typeof api.files.listByProject>[number];

/** Self-contained file list: opens files, and offers owner-only rename/delete. */
export function FileList({ files }: { files: ProjectFile[] }) {
  const t = useTheme();
  const me = useQuery(api.users.me);
  const rename = useMutation(api.files.rename);
  const remove = useMutation(api.files.remove);

  const [editing, setEditing] = useState<ProjectFile | null>(null);
  const [draft, setDraft] = useState("");

  function openFile(file: ProjectFile) {
    if (file.url) {
      void Linking.openURL(file.url);
    }
  }

  function openActions(file: ProjectFile) {
    setEditing(file);
    setDraft(file.name);
  }

  async function saveRename() {
    if (!editing) {
      return;
    }
    const target = editing;
    setEditing(null);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== target.name) {
      await rename({ fileId: target._id, name: trimmed });
    }
  }

  function confirmDelete(file: ProjectFile) {
    setEditing(null);
    Alert.alert("Delete file", `Delete "${file.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void remove({ fileId: file._id }),
      },
    ]);
  }

  return (
    <View style={{ gap: 10 }}>
      {files.map((file) => {
        const owned = me?._id === file.uploadedBy;
        return (
          <View
            key={file._id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: t.card,
              borderColor: t.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 10,
            }}
          >
            <Pressable
              onPress={() => openFile(file)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <FileThumb file={file} />
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="700" numberOfLines={1}>
                  {file.name}
                </Txt>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Txt muted size={12}>
                    {readableSize(file.size)}
                    {file.uploaderName ? ` · ${file.uploaderName}` : ""}
                  </Txt>
                </View>
                {file.eventName ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    <Calendar color={t.muted} size={12} />
                    <Txt muted size={12} numberOfLines={1}>
                      {file.eventName}
                    </Txt>
                  </View>
                ) : null}
              </View>
            </Pressable>
            {owned ? (
              <Pressable
                onPress={() => openActions(file)}
                hitSlop={8}
                style={{ padding: 6 }}
              >
                <Txt size={20} style={{ color: t.primary }}>
                  ⋯
                </Txt>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <Sheet visible={editing !== null} onClose={() => setEditing(null)}>
        <Txt size={18} weight="700">
          File options
        </Txt>
        <Field placeholder="Name" value={draft} onChangeText={setDraft} />
        <Button title="Rename" onPress={saveRename} />
        <Pressable
          onPress={() => editing && confirmDelete(editing)}
          style={{ padding: 10 }}
        >
          <Txt style={{ textAlign: "center", color: "#e64553" }}>
            Delete file
          </Txt>
        </Pressable>
      </Sheet>
    </View>
  );
}

function FileThumb({ file }: { file: ProjectFile }) {
  const t = useTheme();
  if (isImage(file.type) && file.url) {
    return (
      <Image
        source={{ uri: file.url }}
        style={{ width: 44, height: 44, borderRadius: 8 }}
      />
    );
  }
  const Icon = isPdf(file.type) ? FileText : FileIcon;
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.inputBg,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <Icon color={t.muted} size={22} />
    </View>
  );
}
