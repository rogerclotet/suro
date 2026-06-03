import type { Id } from "backend/convex/_generated/dataModel";
import { Alert } from "react-native";
import { useUploadFile } from "@/lib/use-upload-file";
import { Button } from "@/ui";

/** Prompt to pick a photo or a document, then upload it to the project/event. */
export function chooseAndUpload(picker: {
  pickImage: () => void;
  pickDocument: () => void;
}) {
  Alert.alert("Share a file", undefined, [
    { text: "Photo", onPress: picker.pickImage },
    { text: "Document", onPress: picker.pickDocument },
    { text: "Cancel", style: "cancel" },
  ]);
}

export function UploadButton({
  projectId,
  eventId,
  label = "Share files",
}: {
  projectId: Id<"projects">;
  eventId?: Id<"events">;
  label?: string;
}) {
  const { pickImage, pickDocument, busy } = useUploadFile(projectId, eventId);
  return (
    <Button
      title={busy ? "Sharing…" : label}
      disabled={busy}
      variant="ghost"
      onPress={() => chooseAndUpload({ pickImage, pickDocument })}
    />
  );
}
