import { Alert } from "react-native";

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
