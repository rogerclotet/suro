import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { Button, Screen, Txt } from "@/ui";

/**
 * Shown when the open note is gone — deleted here, or by someone else while the
 * screen was on-screen. Offers the way back to the notes index.
 */
export function NoteNotFound() {
  const pid = useProjectId();
  const router = useRouter();
  const tNotes = useTranslations("mobile.notes");

  return (
    <Screen>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
        <Txt muted style={{ textAlign: "center" }}>
          {tNotes("notFound")}
        </Txt>
        <Button
          title={tNotes("title")}
          onPress={() => router.replace(`/${pid}/home/notes`)}
        />
      </View>
    </Screen>
  );
}
