import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Stack } from "expo-router";
import { Monitor, Moon, Sun } from "lucide-react-native";
import { Alert, ScrollView } from "react-native";
import {
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  useLocale,
  useTranslations,
} from "@/i18n";
import { useWearBridge } from "@/lib/wear-bridge";
import { isWearBridgeAvailable } from "@/modules/suro-wear";
import { type ThemePreference, useThemePreference } from "@/theme";
import { Button, Screen, Section, Segmented, Txt } from "@/ui";

/**
 * Device/app preferences (theme, language) — everything that isn't the user's
 * identity, which lives on the profile screen instead.
 */
export default function Preferences() {
  const t = useTranslations("mobile.preferences");

  return (
    <Screen>
      <Stack.Screen options={{ title: t("title") }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 28 }}>
        <ThemeSection />
        <LanguageSection />
        <WatchSection />
      </ScrollView>
    </Screen>
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
  const t = useTranslations("mobile.preferences");
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
  const t = useTranslations("mobile.preferences");
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

/**
 * Watch pairing status, and a way to force a fresh ticket.
 *
 * Pairing is automatic — the bridge pushes a ticket whenever a connected watch
 * needs one — so this exists for the case where it silently didn't work, which
 * is otherwise invisible from the phone. Hidden entirely on builds without the
 * native module (iOS, Expo Go), where there is nothing to report.
 */
function WatchSection() {
  const t = useTranslations("mobile.preferences");
  const { connected, paired, reconnect } = useWearBridge();

  if (!isWearBridgeAvailable) {
    return null;
  }

  const status = !connected
    ? t("watchDisconnected")
    : paired
      ? t("watchPaired")
      : t("watchConnecting");

  return (
    <Section label={t("watch")} hint={t("watchDescription")}>
      <Txt muted>{status}</Txt>
      <Button
        title={t("watchReconnect")}
        variant="ghost"
        onPress={reconnect}
        disabled={!connected}
      />
    </Section>
  );
}
