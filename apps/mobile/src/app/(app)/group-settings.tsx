import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, View } from "react-native";
import { useLocale, useTranslations } from "@/i18n";
import {
  CATPPUCCIN_COLOR_KEYS,
  CATPPUCCIN_COLORS,
} from "@/lib/catppuccin-colors";
import { localizeGroupPath } from "@/lib/group-paths";
import { webUrl } from "@/lib/urls";
import { useTheme } from "@/theme";
import { Button, Field, Loading, Screen, Txt } from "@/ui";

/**
 * Per-group manage page, reached from each row in the group switcher. Editing
 * the name + color is creator-only (the only fields `projects.update` accepts);
 * inviting is open to every member; leaving is shown to non-creators (the
 * creator would orphan the group). A pushed stack screen rather than a tab, so
 * it takes the target group's id as a route param.
 */
export default function GroupSettings() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const tr = useTranslations("mobile.groups");
  const project = useQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
  });
  const me = useQuery(api.users.me);

  const loading = project === undefined || me === undefined;
  const isCreator = !!project && !!me && project.createdBy === me._id;

  return (
    <Screen>
      <Stack.Screen options={{ title: tr("manageGroup") }} />
      {loading ? (
        <Loading />
      ) : !project ? null : (
        <ManageGroup project={project} isCreator={isCreator} />
      )}
    </Screen>
  );
}

function ManageGroup({
  project,
  isCreator,
}: {
  project: Doc<"projects">;
  isCreator: boolean;
}) {
  const t = useTranslations("groups");
  const tc = useTranslations("mobile.common");
  const locale = useLocale();
  const router = useRouter();
  const leave = useMutation(api.projects.leave);

  async function shareInvite() {
    // Share a localized https URL: anyone without the app lands on the web
    // invitation page in their language, and the app opens it directly via
    // Universal Links / App Links when installed (app/+native-intent maps it
    // back to the in-app invitation screen).
    const link = webUrl(
      localizeGroupPath(
        `/groups/${project._id}/invitation/${project.inviteToken}`,
        locale,
      ),
    );
    await Share.share({
      title: t("inviteTitle"),
      message: `${t("inviteDescription")}\n${link}`,
      url: link,
    });
  }

  async function leaveGroup() {
    try {
      await leave({ projectId: project._id });
      // The group we were viewing is gone; let the index route re-route us into
      // a remaining group.
      router.replace("/");
    } catch {
      Alert.alert(t("leaveError"));
    }
  }

  function confirmLeave() {
    Alert.alert(
      t("leaveConfirmTitle"),
      t("leaveConfirmDescription", { name: project.name }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: t("leave"),
          style: "destructive",
          onPress: () => void leaveGroup(),
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
      {isCreator ? <Editor project={project} /> : null}

      <View style={{ gap: 8 }}>
        <Txt size={16} weight="700">
          {t("inviteTitle")}
        </Txt>
        <Txt muted>{t("inviteDescription")}</Txt>
        <Button title={t("share")} onPress={shareInvite} />
      </View>

      {isCreator ? null : (
        <View style={{ gap: 8 }}>
          <Button
            title={t("leaveConfirmTitle")}
            variant="ghost"
            onPress={confirmLeave}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Editor({ project }: { project: Doc<"projects"> }) {
  const t = useTranslations("groups");
  const theme = useTheme();
  const update = useMutation(api.projects.update);

  const [name, setName] = useState(project.name);
  const [savingName, setSavingName] = useState(false);

  const trimmedName = name.trim();
  const nameDirty = trimmedName !== project.name.trim();
  const nameValid = trimmedName.length > 0;

  async function saveName() {
    if (!nameDirty || !nameValid) {
      return;
    }
    setSavingName(true);
    try {
      await update({ projectId: project._id, name: trimmedName });
    } catch {
      Alert.alert(t("editError"));
    } finally {
      setSavingName(false);
    }
  }

  async function selectColor(color: string) {
    if (color === project.color) {
      return;
    }
    try {
      await update({ projectId: project._id, color });
    } catch {
      Alert.alert(t("editError"));
    }
  }

  return (
    <>
      <View style={{ gap: 8 }}>
        <Txt size={16} weight="700">
          {t("name")}
        </Txt>
        <Field
          value={name}
          onChangeText={setName}
          placeholder={t("namePlaceholder")}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={saveName}
        />
        {nameDirty ? (
          <Button
            title={savingName ? t("saving") : t("save")}
            onPress={saveName}
            disabled={savingName || !nameValid}
          />
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Txt size={16} weight="700">
          {t("color")}
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {CATPPUCCIN_COLOR_KEYS.map((key) => {
            const swatch = CATPPUCCIN_COLORS[key];
            const selected = project.color === key;
            return (
              <Pressable
                key={key}
                onPress={() => selectColor(key)}
                accessibilityRole="button"
                accessibilityLabel={key}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: swatch.bg,
                  borderWidth: selected ? 2 : 0,
                  borderColor: theme.text,
                }}
              >
                {selected ? <Check color={swatch.fg} size={18} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
