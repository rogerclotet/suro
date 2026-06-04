import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import { FileList } from "@/components/file-list";
import { sectionHeaderBadges } from "@/components/header-badges";
import { chooseAndUpload } from "@/components/upload-button";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useUploadFile } from "@/lib/use-upload-file";
import { Fab, Loading, Screen, Txt } from "@/ui";

export default function Files() {
  const pid = useProjectId();
  const files = useQuery(api.files.listByProject, { projectId: pid });
  const { pickImage, pickDocument, busy } = useUploadFile(pid);
  const tFiles = useTranslations("mobile.files");
  const tc = useTranslations("mobile.common");

  return (
    <Screen>
      <Stack.Screen
        options={{ title: tFiles("title"), ...sectionHeaderBadges("files") }}
      />
      {files === undefined ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          {busy ? (
            <Txt muted style={{ paddingBottom: 8 }}>
              {tFiles("sharing")}
            </Txt>
          ) : null}
          {files.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Txt muted>{tFiles("empty")}</Txt>
            </View>
          ) : (
            <FileList files={files} />
          )}
        </ScrollView>
      )}
      <Fab
        onPress={() =>
          chooseAndUpload(
            { pickImage, pickDocument },
            {
              title: tFiles("sharePrompt"),
              photo: tFiles("photo"),
              document: tFiles("document"),
              cancel: tc("cancel"),
            },
          )
        }
      />
    </Screen>
  );
}
