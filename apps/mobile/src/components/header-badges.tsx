import { Plus } from "lucide-react-native";
import { Platform, Pressable } from "react-native";
import { GroupBadge } from "@/components/group-switcher";
import { useTheme } from "@/theme";

/** A screen's primary create action: what to do, and how to label it for a11y. */
export type CreateAction = { onPress: () => void; label: string };

/**
 * Glass "+" header item that triggers a screen's create action — a tinted lucide
 * icon with no background, sitting in the native Liquid Glass capsule. iOS only;
 * on Android the create affordance is the `Fab`.
 */
function HeaderCreateButton({ onPress, label }: CreateAction) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Plus color={t.primary} size={22} />
    </Pressable>
  );
}

/**
 * Header options that place a screen's create "+" in the iOS navigation bar,
 * for screens without the section badges (e.g. nested detail screens). Android
 * is left untouched — the `Fab` is the create affordance there.
 */
export function headerCreateAction(create: CreateAction) {
  if (Platform.OS !== "ios") {
    return {};
  }
  return {
    unstable_headerRightItems: () => [
      { type: "custom" as const, element: <HeaderCreateButton {...create} /> },
    ],
  };
}

/**
 * Header options for a section: the group badge (left) and, when a `create`
 * action is given, the iOS "+" create button (right). The profile/account entry
 * lives inside the group switcher sheet (`GroupSwitcherSheet`), not the header.
 *
 * The `unstable_header*Items` API is used on iOS only (react-navigation gates it
 * to iOS); there the badge renders the `glass` variant inside the native Liquid
 * Glass capsule. `headerLeft` is the Android path, where the filled Catppuccin
 * avatar is shown (Android has no capsule, and create is the `Fab`).
 */
export function sectionHeaderBadges(section: string, create?: CreateAction) {
  return {
    headerLeft: () => <GroupBadge section={section} />,
    unstable_headerLeftItems: () => [
      {
        type: "custom" as const,
        element: <GroupBadge section={section} variant="glass" />,
      },
    ],
    ...(create ? headerCreateAction(create) : {}),
  };
}
