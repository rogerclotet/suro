import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { File, UploadType } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import {
  Camera,
  Check,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import {
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  useLocale,
  useTranslations,
} from "@/i18n";
import {
  CATPPUCCIN_COLOR_KEYS,
  CATPPUCCIN_COLORS,
} from "@/lib/catppuccin-colors";
import { type ThemePreference, useTheme, useThemePreference } from "@/theme";
import { Button, Field, Loading, Screen, Txt } from "@/ui";

export default function Profile() {
  const user = useQuery(api.users.me);
  const t = useTranslations("mobile.profile");

  return (
    <Screen>
      <Stack.Screen options={{ title: t("title") }} />
      {user === undefined || user === null ? (
        <Loading />
      ) : (
        <ProfileForm user={user} />
      )}
    </Screen>
  );
}

function ProfileForm({ user }: { user: Doc<"users"> }) {
  const t = useTranslations("mobile.profile");
  const theme = useTheme();
  const { signOut } = useAuthActions();
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState(user.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const trimmedName = name.trim();
  const nameDirty = trimmedName !== (user.name ?? "").trim();
  const nameValid = trimmedName.length > 0;

  async function saveName() {
    if (!nameDirty || !nameValid) {
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ name: trimmedName });
    } catch {
      Alert.alert(t("saveError"));
    } finally {
      setSavingName(false);
    }
  }

  async function selectColor(color: string) {
    try {
      await updateProfile({ avatarColor: color });
    } catch {
      Alert.alert(t("saveError"));
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
      <AvatarSection user={user} />

      <Section label={t("name")} hint={t("nameHint")}>
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
            title={savingName ? t("saving") : t("saveName")}
            onPress={saveName}
            disabled={savingName || !nameValid}
          />
        ) : null}
      </Section>

      <Section label={t("email")}>
        <Txt muted>{user.email ?? "—"}</Txt>
      </Section>

      <Section label={t("backgroundColor")} hint={t("backgroundColorHint")}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {CATPPUCCIN_COLOR_KEYS.map((key) => {
            const swatch = CATPPUCCIN_COLORS[key];
            const selected = user.avatarColor === key;
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
      </Section>

      <ThemeSection />
      <LanguageSection />

      <Button
        title={t("signOut")}
        variant="ghost"
        onPress={() => void signOut()}
      />
    </ScrollView>
  );
}

function AvatarSection({ user }: { user: Doc<"users"> }) {
  const t = useTranslations("mobile.profile");
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatarImage = useMutation(api.users.setAvatarImage);
  const removeAvatarImage = useMutation(api.users.removeAvatarImage);
  const resetProviderImage = useMutation(api.users.resetProviderImage);
  const [busy, setBusy] = useState(false);

  const hasCustom = Boolean(user.customImage);
  const hasProvider = Boolean(user.image);
  const displayImage = user.customImage ?? user.image ?? null;

  async function changePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("photoPermissionTitle"), t("photoPermissionBody"));
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
      const postUrl = await generateUploadUrl();
      // RN's fetch can't turn a file:// URI into a Blob ("Creating blobs from
      // 'ArrayBuffer' ... are not supported"), so stream the bytes natively.
      const res = await new File(asset.uri).upload(postUrl, {
        httpMethod: "POST",
        uploadType: UploadType.BINARY_CONTENT,
        headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Upload failed (${res.status})`);
      }
      const { storageId } = JSON.parse(res.body) as { storageId: string };
      await setAvatarImage({ storageId: storageId as Id<"_storage"> });
    } catch {
      Alert.alert(t("photoError"));
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<null>) {
    setBusy(true);
    try {
      await action();
    } catch {
      Alert.alert(t("photoError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Avatar
        name={user.name}
        image={displayImage}
        color={user.avatarColor}
        size={96}
        onPress={busy ? undefined : changePhoto}
        accessibilityLabel={t("changePhoto")}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <AvatarAction
          icon={Camera}
          label={busy ? t("working") : t("changePhoto")}
          onPress={changePhoto}
          disabled={busy}
        />
        {hasCustom && hasProvider ? (
          <AvatarAction
            icon={RotateCcw}
            label={t("useProviderPhoto")}
            onPress={() => void run(() => resetProviderImage())}
            disabled={busy}
          />
        ) : null}
        {hasCustom || hasProvider ? (
          <AvatarAction
            icon={Trash2}
            label={t("removePhoto")}
            onPress={() => void run(() => removeAvatarImage())}
            disabled={busy}
          />
        ) : null}
      </View>
    </View>
  );
}

function AvatarAction({
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
  const t = useTheme();
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
      <Icon color={t.primary} size={16} />
      <Txt size={14} style={{ color: t.primary }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const THEME_OPTIONS: {
  value: ThemePreference;
  labelKey: "themeLight" | "themeDark" | "themeSystem";
  icon: typeof Sun;
}[] = [
  { value: "light", labelKey: "themeLight", icon: Sun },
  { value: "dark", labelKey: "themeDark", icon: Moon },
  { value: "system", labelKey: "themeSystem", icon: Monitor },
];

function ThemeSection() {
  const t = useTranslations("mobile.profile");
  const { preference, setPreference } = useThemePreference();

  return (
    <Section label={t("theme")} hint={t("themeDescription")}>
      <Segmented
        options={THEME_OPTIONS.map((option) => ({
          key: option.value,
          label: t(option.labelKey),
          icon: option.icon,
          active: preference === option.value,
          onPress: () => setPreference(option.value),
        }))}
      />
    </Section>
  );
}

function LanguageSection() {
  const t = useTranslations("mobile.profile");
  const locale = useLocale();
  const updateProfile = useMutation(api.users.updateProfile);

  function selectLocale(next: Locale) {
    void updateProfile({ locale: next }).catch(() => {
      Alert.alert(t("saveError"));
    });
  }

  return (
    <Section label={t("language")} hint={t("languageDescription")}>
      <Segmented
        options={LOCALES.map((value) => ({
          key: value,
          label: LOCALE_LABELS[value],
          active: locale === value,
          onPress: () => selectLocale(value),
        }))}
      />
    </Section>
  );
}

type SegmentedOption = {
  key: string;
  label: string;
  icon?: typeof Sun;
  active: boolean;
  onPress: () => void;
};

/** Equal-width segmented control shared by the theme and language selectors. */
function Segmented({ options }: { options: SegmentedOption[] }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {options.map((option, index) => {
        const Icon = option.icon;
        return (
          <Pressable
            key={option.key}
            onPress={option.onPress}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 11,
              backgroundColor: option.active ? t.primary : "transparent",
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: t.border,
            }}
          >
            {Icon ? (
              <Icon color={option.active ? t.onPrimary : t.text} size={16} />
            ) : null}
            <Txt
              size={14}
              weight={option.active ? "700" : "400"}
              style={{ color: option.active ? t.onPrimary : t.text }}
            >
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Txt size={16} weight="700">
        {label}
      </Txt>
      {children}
      {hint ? (
        <Txt muted size={13} style={{ fontStyle: "italic" }}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}
