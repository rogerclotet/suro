import { api } from "backend/convex/_generated/api";
import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import { FileGallery } from "@/components/file-gallery";
import { headerCreateAction } from "@/components/header-badges";
import { chooseAndUpload } from "@/components/upload-button";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useUploadFile } from "@/lib/use-upload-file";
import { Fab, Loading, Screen, Txt, useFabScroll } from "@/ui";

export default function Files() {
  const pid = useProjectId();
  const files = usePersistentQuery(api.files.listByProject, { projectId: pid });
  const { pickImage, pickDocument, pending } = useUploadFile(pid);
  const tFiles = useTranslations("mobile.files");
  const tc = useTranslations("mobile.common");
  const fab = useFabScroll();

  const onCreate = () =>
    chooseAndUpload(
      { pickImage, pickDocument },
      {
        title: tFiles("sharePrompt"),
        photo: tFiles("photo"),
        document: tFiles("document"),
        cancel: tc("cancel"),
      },
    );

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tFiles("title"),
          ...headerCreateAction({
            onPress: onCreate,
            label: tFiles("shareFiles"),
          }),
        }}
      />
      {files === undefined ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          onScroll={fab.onScroll}
          scrollEventThrottle={16}
        >
          {files.length === 0 && !pending ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Txt muted>{tFiles("empty")}</Txt>
            </View>
          ) : (
            <FileGallery files={files} pending={pending} />
          )}
        </ScrollView>
      )}
      <Fab
        onPress={onCreate}
        label={tFiles("shareFiles")}
        extended={fab.extended}
      />
    </Screen>
  );
}
