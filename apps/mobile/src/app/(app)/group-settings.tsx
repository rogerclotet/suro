import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { File, UploadType } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Check, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, View } from "react-native";
import { Avatar } from "@/components/avatar";
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
          {t("groupImage")}
        </Txt>
        <GroupImage project={project} />
      </View>

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

/**
 * Creator-only group picture editor. Mirrors the profile avatar flow: pick from
 * the photo library, stream the bytes natively to a Convex upload URL, then
 * persist the storage id. Creator-only access is enforced server-side in the
 * `projects` mutations; this section only renders inside the creator `Editor`.
 */
function GroupImage({ project }: { project: Doc<"projects"> }) {
  const t = useTranslations("groups");
  const generateUploadUrl = useMutation(api.projects.generateImageUploadUrl);
  const setImage = useMutation(api.projects.setImage);
  const removeImage = useMutation(api.projects.removeImage);
  const [busy, setBusy] = useState(false);

  async function changeImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("imagePermissionTitle"), t("imagePermissionBody"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) {
      return;
    }
    setBusy(true);
    try {
      const postUrl = await generateUploadUrl({ projectId: project._id });
      // RN's fetch can't turn a file:// URI into a Blob, so stream the bytes
      // natively (same as the profile avatar upload).
      const res = await new File(asset.uri).upload(postUrl, {
        httpMethod: "POST",
        uploadType: UploadType.BINARY_CONTENT,
        headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Upload failed (${res.status})`);
      }
      const { storageId } = JSON.parse(res.body) as { storageId: string };
      await setImage({
        projectId: project._id,
        storageId: storageId as Id<"_storage">,
      });
    } catch {
      Alert.alert(t("imageError"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await removeImage({ projectId: project._id });
    } catch {
      Alert.alert(t("imageError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Avatar
        name={project.name}
        image={project.image}
        color={project.color}
        size={96}
        onPress={busy ? undefined : changeImage}
        accessibilityLabel={t("changeImage")}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <ImageAction
          icon={Camera}
          label={busy ? t("saving") : t("changeImage")}
          onPress={changeImage}
          disabled={busy}
        />
        {project.image ? (
          <ImageAction
            icon={Trash2}
            label={t("removeImage")}
            onPress={() => void remove()}
            disabled={busy}
          />
        ) : null}
      </View>
    </View>
  );
}

function ImageAction({
  icon: Icon,
  label,
  onPress,
  disabled,
}: {
  icon: typeof Camera;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Icon color={theme.primary} size={16} />
      <Txt size={14} style={{ color: theme.primary }}>
        {label}
      </Txt>
    </Pressable>
  );
}
