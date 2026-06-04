import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as DocumentPicker from "expo-document-picker";
import { File, UploadType } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";
import { useTranslations } from "@/i18n";
import { stripExtension } from "@/lib/files";

type PickedAsset = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

/**
 * Upload a picked file to Convex storage in the standard three steps: ask for a
 * short-lived upload URL, POST the bytes, then persist the row. Exposes
 * `pickImage`/`pickDocument` (photo library + system file picker) plus `busy`.
 */
export function useUploadFile(
  projectId: Id<"projects">,
  eventId?: Id<"events">,
) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const t = useTranslations("mobile.files");
  const [busy, setBusy] = useState(false);

  async function upload(asset: PickedAsset) {
    setBusy(true);
    try {
      const postUrl = await generateUploadUrl({ projectId });
      // RN's fetch can't turn a file:// URI into a Blob ("Creating blobs from
      // 'ArrayBuffer' ... are not supported"), so stream the bytes natively.
      const res = await new File(asset.uri).upload(postUrl, {
        httpMethod: "POST",
        uploadType: UploadType.BINARY_CONTENT,
        headers: { "Content-Type": asset.mimeType },
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Upload failed (${res.status})`);
      }
      const { storageId } = JSON.parse(res.body) as { storageId: string };
      await saveFile({
        projectId,
        eventId,
        storageId: storageId as Id<"_storage">,
        name: stripExtension(asset.name),
        type: asset.mimeType,
        size: asset.size,
      });
    } catch (error) {
      Alert.alert(
        t("uploadFailedTitle"),
        error instanceof Error ? error.message : t("uploadFailedBody"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permissionTitle"), t("permissionBody"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) {
      return;
    }
    await upload({
      uri: asset.uri,
      name: asset.fileName ?? "image",
      mimeType: asset.mimeType ?? "image/jpeg",
      size: asset.fileSize ?? 0,
    });
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) {
      return;
    }
    await upload({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "application/octet-stream",
      size: asset.size ?? 0,
    });
  }

  return { pickImage, pickDocument, busy };
}
