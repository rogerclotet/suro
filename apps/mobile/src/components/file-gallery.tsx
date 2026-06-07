import { api } from "backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Calendar,
  File as FileIcon,
  FileText,
  type LucideIcon,
  MoreHorizontal,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  type LayoutChangeEvent,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTranslations } from "@/i18n";
import { isImage, isPdf, readableSize } from "@/lib/files";
import type { PendingUpload } from "@/lib/use-upload-file";
import { useTheme } from "@/theme";
import { Button, Field, Sheet, Txt } from "@/ui";

type ProjectFile = FunctionReturnType<typeof api.files.listByProject>[number];

const GAP = 10;
// Aim for tiles at least this wide; the grid adds columns on roomier screens
// but never drops below three so phone galleries stay dense.
const MIN_TILE = 104;

/** Square tiles per row and their pixel size for the measured container width. */
function gridFor(width: number) {
  const columns = Math.max(3, Math.floor((width + GAP) / (MIN_TILE + GAP)));
  const tile = Math.floor((width - GAP * (columns - 1)) / columns);
  return { tile };
}

/**
 * Files as a thumbnail gallery: images preview in place, other types show a
 * typed icon tile. An in-flight upload appears as an optimistic tile up front,
 * and owners get rename/delete via the tile's ⋯ button or a long-press.
 */
export function FileGallery({
  files,
  pending,
  showEventBadge = true,
}: {
  files: ProjectFile[];
  pending?: PendingUpload | null;
  showEventBadge?: boolean;
}) {
  const t = useTheme();
  const tFiles = useTranslations("mobile.files");
  const tc = useTranslations("mobile.common");
  const me = useQuery(api.users.me);
  const rename = useMutation(api.files.rename);
  const remove = useMutation(api.files.remove);

  const [width, setWidth] = useState(0);
  const [editing, setEditing] = useState<ProjectFile | null>(null);
  const [draft, setDraft] = useState("");

  if (files.length === 0 && !pending) {
    return null;
  }

  const { tile } = gridFor(width || MIN_TILE * 3 + GAP * 2);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

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
    Alert.alert(
      tFiles("deleteFile"),
      tFiles("deleteMessage", { name: file.name }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => void remove({ fileId: file._id }),
        },
      ],
    );
  }

  return (
    <View
      onLayout={onLayout}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}
    >
      {/* Only render tiles once measured, so they're sized to the container. */}
      {width === 0 ? null : (
        <>
          {pending ? <UploadingTile pending={pending} size={tile} /> : null}
          {files.map((file) => (
            <GalleryTile
              key={file._id}
              file={file}
              size={tile}
              owned={me?._id === file.uploadedBy}
              showEventBadge={showEventBadge}
              onPress={() => openFile(file)}
              onActions={() => openActions(file)}
            />
          ))}
        </>
      )}

      <Sheet visible={editing !== null} onClose={() => setEditing(null)}>
        <Txt size={18} weight="700">
          {tFiles("fileOptions")}
        </Txt>
        <Field placeholder={tc("name")} value={draft} onChangeText={setDraft} />
        <Button title={tFiles("rename")} onPress={saveRename} />
        <Pressable
          onPress={() => editing && confirmDelete(editing)}
          style={{ padding: 10 }}
        >
          <Txt style={{ textAlign: "center", color: t.danger }}>
            {tFiles("deleteFile")}
          </Txt>
        </Pressable>
      </Sheet>
    </View>
  );
}

function GalleryTile({
  file,
  size,
  owned,
  showEventBadge,
  onPress,
  onActions,
}: {
  file: ProjectFile;
  size: number;
  owned: boolean;
  showEventBadge: boolean;
  onPress: () => void;
  onActions: () => void;
}) {
  return (
    <View style={{ width: size }}>
      <Pressable
        onPress={onPress}
        onLongPress={owned ? onActions : undefined}
        accessibilityRole="button"
        accessibilityLabel={file.name}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Thumb file={file} size={size} />
        {showEventBadge && file.eventName ? (
          <View
            style={{
              position: "absolute",
              left: 6,
              bottom: 6,
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <Calendar color="#ffffff" size={13} />
          </View>
        ) : null}
        {owned ? (
          <Pressable
            onPress={onActions}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={file.name}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 26,
              height: 26,
              borderRadius: 13,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <MoreHorizontal color="#ffffff" size={16} />
          </Pressable>
        ) : null}
      </Pressable>
      <Txt size={12} weight="700" numberOfLines={1} style={{ marginTop: 6 }}>
        {file.name}
      </Txt>
      <Txt muted size={11} numberOfLines={1}>
        {readableSize(file.size)}
      </Txt>
    </View>
  );
}

/**
 * The square thumbnail: an image preview for images, the rendered page-1 preview
 * for PDFs once it exists, and a typed icon tile otherwise (red "PDF" glyph for
 * PDFs whose preview hasn't generated yet, a neutral file icon for other types).
 */
function Thumb({ file, size }: { file: ProjectFile; size: number }) {
  const t = useTheme();
  const previewUrl = isImage(file.type)
    ? file.url
    : isPdf(file.type)
      ? file.thumbnailUrl
      : null;

  if (previewUrl) {
    return (
      <View>
        <Image
          source={{ uri: previewUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            backgroundColor: t.inputBg,
          }}
        />
        {isPdf(file.type) ? <PdfBadge /> : null}
      </View>
    );
  }

  return isPdf(file.type) ? (
    <IconTile size={size} icon={FileText} color={t.pdf} label="PDF" />
  ) : (
    <IconTile size={size} icon={FileIcon} color={t.muted} />
  );
}

/** A square icon tile: a centered glyph over an optional caption (e.g. "PDF"). */
function IconTile({
  size,
  icon: Icon,
  color,
  label,
}: {
  size: number;
  icon: LucideIcon;
  color: string;
  label?: string;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: t.inputBg,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <Icon color={color} size={Math.round(size * 0.3)} />
      {label ? (
        <Txt
          size={Math.max(9, Math.round(size * 0.1))}
          weight="700"
          style={{ color, letterSpacing: 1 }}
        >
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

/** Small red "PDF" chip, overlaid on a PDF page preview so its type stays clear. */
function PdfBadge() {
  const t = useTheme();
  return (
    <View
      style={{
        position: "absolute",
        right: 6,
        bottom: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: t.pdf,
      }}
    >
      <Txt
        size={10}
        weight="700"
        style={{ color: "#ffffff", letterSpacing: 1 }}
      >
        PDF
      </Txt>
    </View>
  );
}

/** Optimistic tile for the upload in flight: the picked preview under a spinner. */
function UploadingTile({
  pending,
  size,
}: {
  pending: PendingUpload;
  size: number;
}) {
  const t = useTheme();
  const tFiles = useTranslations("mobile.files");
  return (
    <View style={{ width: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.inputBg,
          borderWidth: 1,
          borderColor: t.border,
        }}
      >
        {pending.isImage ? (
          <Image
            source={{ uri: pending.uri }}
            style={{ position: "absolute", width: size, height: size }}
          />
        ) : isPdf(pending.type) ? (
          <FileText color={t.pdf} size={Math.round(size * 0.3)} />
        ) : (
          <FileIcon color={t.muted} size={Math.round(size * 0.34)} />
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pending.isImage
                ? "rgba(0,0,0,0.35)"
                : "transparent",
            },
          ]}
        >
          <ActivityIndicator color={pending.isImage ? "#ffffff" : t.primary} />
        </View>
      </View>
      <Txt
        size={12}
        weight="700"
        numberOfLines={1}
        style={{ marginTop: 6, color: t.primary }}
      >
        {tFiles("uploading")}
      </Txt>
    </View>
  );
}
