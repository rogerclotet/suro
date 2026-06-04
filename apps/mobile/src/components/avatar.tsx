import {
  Image,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { catppuccinSwatch } from "@/lib/catppuccin-colors";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/** Size for the group/profile badges in the navigation header. */
export const HEADER_AVATAR_SIZE = 34;

/**
 * 1–2 uppercase letters: the first letters of the first two words, or the
 * single first letter of a one-word name.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  const first = (words[0] as string).charAt(0);
  if (words.length === 1) {
    return first.toUpperCase();
  }
  return (first + (words[1] as string).charAt(0)).toUpperCase();
}

/**
 * Rounded-square avatar shared by group and profile badges: the picture if set,
 * otherwise initials on the entity's Catppuccin color. When `onPress` is given
 * the avatar itself is the button — there's no wrapping container.
 */
export function Avatar({
  name,
  image,
  color,
  size = 30,
  onPress,
  accessibilityLabel,
  style,
}: {
  name?: string | null;
  image?: string | null;
  color?: string | null;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const swatch = catppuccinSwatch(color);
  const base: ViewStyle = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.3),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: image ? t.inputBg : (swatch?.bg ?? t.primary),
  };

  const content = image ? (
    <Image source={{ uri: image }} style={{ width: size, height: size }} />
  ) : (
    <Txt
      weight="700"
      size={Math.round(size * 0.42)}
      style={{ color: swatch?.fg ?? t.onPrimary }}
    >
      {name ? initials(name) : ""}
    </Txt>
  );

  if (!onPress) {
    return <View style={[base, style]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, { opacity: pressed ? 0.8 : 1 }, style]}
    >
      {content}
    </Pressable>
  );
}
