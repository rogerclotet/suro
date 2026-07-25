import { type LucideIcon, Plus } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";
import { useTheme } from "@/theme";
import { HEADER_BUTTON_INSET } from "@/ui";

/** A screen's primary create action: what to do, and how to label it for a11y. */
export type CreateAction = { onPress: () => void; label: string };

/** A secondary header action: its icon, what it does, and its a11y label. */
export type HeaderAction = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
};

/**
 * Glass "+" header item that triggers a screen's create action: a tinted lucide
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
 * A tinted lucide icon header item, the secondary-action sibling of
 * `HeaderCreateButton` (e.g. calendar export). Sits in the iOS Liquid Glass
 * capsule or the Android header bar.
 */
function HeaderActionButton({ icon: Icon, onPress, label }: HeaderAction) {
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
