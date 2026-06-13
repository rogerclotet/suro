import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useTranslations } from "@/i18n";
import { Button, Field, Screen, Txt } from "@/ui";

/**
 * Create a new group. Reached from the group switcher's create action, and the
 * landing fallback when a user somehow has no group to resume into. On success
 * we replace into the new group so it never lingers in the back stack.
 */
export default function CreateGroup() {
  const t = useTranslations("groups");
  const tc = useTranslations("mobile.common");
  const create = useMutation(api.projects.create);
  const router = useRouter();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();

  async function submit() {
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const projectId = await create({ name: trimmed });
      router.replace(`/${projectId}/calendar`);
    } catch {
      Alert.alert(t("createError"));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("createTitle") }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <Txt muted>{t("createDescription")}</Txt>
        <View style={{ gap: 8 }}>
          <Txt size={16} weight="700">
            {t("name")}
          </Txt>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={t("namePlaceholder")}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={!busy}
          />
        </View>
        <Button
          title={busy ? tc("creating") : t("createTitle")}
          onPress={submit}
          disabled={busy || !trimmed}
        />
      </ScrollView>
    </Screen>
  );
}
