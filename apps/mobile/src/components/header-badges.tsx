import { ChevronLeft, type LucideIcon, Plus } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";
import { UnreadBadge } from "@/components/unread-badge";
import { useTheme } from "@/theme";
import { HEADER_BUTTON_INSET } from "@/ui";

/**
 * A screen's primary action: what to do, how to label it for a11y, and its icon
 * when it isn't the usual "+" (the note viewer's pencil, say).
 */
export type CreateAction = {
  onPress: () => void;
  label: string;
  icon?: LucideIcon;
};

/** A secondary header action: its icon, what it does, and its a11y label. */
export type HeaderAction = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  count?: number;
};

/**
 * Glass "+" header item that triggers a screen's primary action: a tinted lucide
 * icon with no background, sitting in the native Liquid Glass capsule. iOS only;
 * on Android that affordance is the `Fab`.
 */
function HeaderCreateButton({
  onPress,
  label,
  icon: Icon = Plus,
}: CreateAction) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon color={t.primary} size={22} />
    </Pressable>
  );
}

/**
 * A tinted lucide icon header item, the secondary-action sibling of
 * `HeaderCreateButton` (e.g. calendar export). Sits in the iOS Liquid Glass
 * capsule or the Android header bar.
 */
function HeaderActionButton({
  icon: Icon,
  onPress,
  label,
  count = 0,
}: HeaderAction) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
    >
      <Icon color={t.primary} size={22} />
      <UnreadBadge count={count} />
    </Pressable>
  );
}

/**
 * Header options that place a screen's create "+" and any secondary `actions`
 * in the navigation bar, for screens without section create actions (e.g.
 * nested detail screens). On iOS both sit in the Liquid Glass capsule via
 * `unstable_headerRightItems`, with the actions to the left of the "+". On
 * Android the create affordance is the `Fab`, so only the secondary actions go
 * in `headerRight`.
 */
export function headerCreateAction(
  create?: CreateAction,
  actions: HeaderAction[] = [],
) {
  if (Platform.OS !== "ios") {
    if (actions.length === 0) {
      return {};
    }
    return {
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingHorizontal: HEADER_BUTTON_INSET,
          }}
        >
          {actions.map((action) => (
            <HeaderActionButton key={action.label} {...action} />
          ))}
        </View>
      ),
    };
  }
  return {
    unstable_headerRightItems: () => [
      ...actions.map((action) => ({
        type: "custom" as const,
        element: <HeaderActionButton {...action} />,
      })),
      ...(create
        ? [
            {
              type: "custom" as const,
              element: <HeaderCreateButton {...create} />,
            },
          ]
        : []),
    ],
  };
}

/**
 * Header options for a screen that is the root of its own nested `Stack`
 * (e.g. home/notes, home/files) and so never has its own back history —
 * its parent Stack.Screen is hidden to avoid a duplicate header, which
 * also drops the native back button. Renders an explicit one that calls
 * `onBack` (typically `router.back()`).
 */
export function headerBackAction(onBack: () => void, label: string) {
  return {
    headerLeft: () => <HeaderBackButton onPress={onBack} label={label} />,
  };
}

function HeaderBackButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ChevronLeft color={t.primary} size={26} />
    </Pressable>
  );
}

/**
 * Header options for a section screen: an optional iOS "+" create button
 * (right) and any secondary `actions` (right). Section titles come from
 * `Stack.Screen`'s `title` option.
 */
export function sectionHeaderBadges(
  _section: string,
  create?: CreateAction,
  actions: HeaderAction[] = [],
) {
  return headerCreateAction(create, actions);
}
