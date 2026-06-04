import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ScrollView, View } from "react-native";
import { FileList } from "@/components/file-list";
import { chooseAndUpload } from "@/components/upload-button";
import { useProjectId } from "@/lib/project-id";
import { useUploadFile } from "@/lib/use-upload-file";
import { Fab, Loading, Screen, Txt } from "@/ui";

export default function Files() {
  const pid = useProjectId();
  const files = useQuery(api.files.listByProject, { projectId: pid });
  const { pickImage, pickDocument, busy } = useUploadFile(pid);

  return (
    <Screen>
      {files === undefined ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          {busy ? (
            <Txt muted style={{ paddingBottom: 8 }}>
              Sharing…
            </Txt>
          ) : null}
          {files.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Txt muted>No files yet. Tap + to share one.</Txt>
            </View>
          ) : (
            <FileList files={files} />
          )}
        </ScrollView>
      )}
      <Fab onPress={() => chooseAndUpload({ pickImage, pickDocument })} />
    </Screen>
  );
}
