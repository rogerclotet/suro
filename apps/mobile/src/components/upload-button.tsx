import type { Id } from "backend/convex/_generated/dataModel";
import { Alert } from "react-native";
import { useTranslations } from "@/i18n";
import { useUploadFile } from "@/lib/use-upload-file";
import { Button } from "@/ui";

/** Labels for the share-a-file action sheet (passed in so callers localize). */
export type UploadLabels = {
  title: string;
  photo: string;
  document: string;
  cancel: string;
};

/** Prompt to pick a photo or a document, then upload it to the project/event. */
export function chooseAndUpload(
  picker: {
    pickImage: () => void;
    pickDocument: () => void;
  },
  labels: UploadLabels,
) {
  Alert.alert(labels.title, undefined, [
    { text: labels.photo, onPress: picker.pickImage },
    { text: labels.document, onPress: picker.pickDocument },
    { text: labels.cancel, style: "cancel" },
  ]);
}

export function UploadButton({
  projectId,
  eventId,
}: {
  projectId: Id<"projects">;
  eventId?: Id<"events">;
}) {
  const t = useTranslations("mobile.files");
  const tCommon = useTranslations("mobile.common");
  const { pickImage, pickDocument, busy } = useUploadFile(projectId, eventId);
  return (
    <Button
      title={busy ? t("sharing") : t("shareFiles")}
      disabled={busy}
      variant="ghost"
      onPress={() =>
        chooseAndUpload(
          { pickImage, pickDocument },
          {
            title: t("sharePrompt"),
            photo: t("photo"),
            document: t("document"),
            cancel: tCommon("cancel"),
          },
        )
      }
    />
  );
}
