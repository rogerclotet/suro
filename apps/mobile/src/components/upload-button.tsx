import { Alert } from "react-native";
import { useTranslations } from "@/i18n";
import { Button } from "@/ui";

type Picker = {
  pickImage: () => void;
  pickDocument: () => void;
};

/** Labels for the share-a-file action sheet (passed in so callers localize). */
export type UploadLabels = {
  title: string;
  photo: string;
  document: string;
  cancel: string;
};

/** Prompt to pick a photo or a document, then upload it to the project/event. */
export function chooseAndUpload(picker: Picker, labels: UploadLabels) {
  Alert.alert(labels.title, undefined, [
    { text: labels.photo, onPress: picker.pickImage },
    { text: labels.document, onPress: picker.pickDocument },
    { text: labels.cancel, style: "cancel" },
  ]);
}

/**
 * Ghost "share" button. Presentational — the caller owns the upload hook so it
 * can also surface the in-flight `pending` tile in its gallery.
 */
export function UploadButton({
  picker,
  busy,
}: {
  picker: Picker;
  busy: boolean;
}) {
  const t = useTranslations("mobile.files");
  const tCommon = useTranslations("mobile.common");
  return (
    <Button
      title={busy ? t("sharing") : t("shareFiles")}
      disabled={busy}
      variant="ghost"
      onPress={() =>
        chooseAndUpload(picker, {
          title: t("sharePrompt"),
          photo: t("photo"),
          document: t("document"),
          cancel: tCommon("cancel"),
        })
      }
    />
  );
}
