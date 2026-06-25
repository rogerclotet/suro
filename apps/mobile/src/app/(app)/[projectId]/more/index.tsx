import { Stack, useRouter } from "expo-router";
import { Folder, type LucideIcon, NotebookText } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Card, Screen, Txt } from "@/ui";

// Sections reached through "More" rather than the bottom bar. `key` doubles as
// the route segment (`/<pid>/more/<key>`) and the `nav` i18n key. Moving a
// section in or out of the bar is a one-line change here plus the tab triggers.
const OVERFLOW_SECTIONS = [
  { key: "files", icon: Folder },
  { key: "notes", icon: NotebookText },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

const ICON_BADGE = 56;

function SectionCard({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
        <View
          style={{
            width: ICON_BADGE,
            height: ICON_BADGE,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${t.primary}1a`,
          }}
        >
          <Icon color={t.primary} size={28} />
        </View>
        <Txt weight="700" numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Card>
  );
}

export default function MoreOverview() {
  const pid = useProjectId();
  const router = useRouter();
  const tNav = useTranslations("nav");

  // Render explicit two-wide rows of `flex: 1` cells rather than wrapping
  // percentage-width cells, which overflow and wrap early on Android.
  const rows: (typeof OVERFLOW_SECTIONS)[number][][] = [];
  for (let i = 0; i < OVERFLOW_SECTIONS.length; i += 2) {
    rows.push(OVERFLOW_SECTIONS.slice(i, i + 2));
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tNav("more"),
          // Group badge + switcher; group switch returns to this More tab.
          ...sectionHeaderBadges("more"),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {rows.map((row) => (
          <View
            key={row.map((s) => s.key).join("-")}
            style={{ flexDirection: "row", gap: 12 }}
          >
            {row.map((section) => (
              <View key={section.key} style={{ flex: 1 }}>
                <SectionCard
                  label={tNav(section.key)}
                  icon={section.icon}
                  onPress={() => router.push(`/${pid}/more/${section.key}`)}
                />
              </View>
            ))}
            {/* Pad a trailing odd cell so the last row's card keeps its width. */}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
