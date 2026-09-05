import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Monitor, Moon, Sun } from "lucide-react-native";
import { Alert } from "react-native";
import {
  LOCALE_LABELS,
  LOCALES,
  type Locale,
  useLocale,
  useTranslations,
} from "@/i18n";
import { type ThemePreference, useThemePreference } from "@/theme";
import { Section, Segmented } from "@/ui";

export function ProfilePreferences() {
  return (
    <>
      <ThemeSection />
      <LanguageSection />
    </>
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
