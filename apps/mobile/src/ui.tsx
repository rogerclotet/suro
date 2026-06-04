import { Plus } from "lucide-react-native";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT, useTheme } from "./theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// Tracks how many sheets are currently open so chrome like the FAB can step
// aside while a drawer is on screen — otherwise the FAB's bright shadow bleeds
// through the backdrop as it fades in.
const SheetCountContext = createContext<{
  anyOpen: boolean;
  acquire: () => void;
  release: () => void;
}>({ anyOpen: false, acquire: () => {}, release: () => {} });

export function SheetHost({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);
  const acquire = useCallback(() => setOpenCount((c) => c + 1), []);
  const release = useCallback(
    () => setOpenCount((c) => Math.max(0, c - 1)),
    [],
  );
  const value = useMemo(
    () => ({ anyOpen: openCount > 0, acquire, release }),
    [openCount, acquire, release],
  );
  return (
    <SheetCountContext.Provider value={value}>
      {children}
    </SheetCountContext.Provider>
  );
}

export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTheme();
  const { acquire, release } = useContext(SheetCountContext);
  const [mounted, setMounted] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Register as open for as long as the parent wants us visible; release on the
  // way out so the FAB can reappear as we animate away.
  useEffect(() => {
    if (!visible) {
      return;
    }
    acquire();
    return release;
  }, [visible, acquire, release]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [visible, anim]);

  if (!mounted) {
    return null;
  }

  // Backdrop fades opacity in place; only the panel translates up — so the
  // dark overlay no longer rides up with the drawer.
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", opacity: anim }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: t.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          paddingBottom: 36,
          gap: 12,
          transform: [{ translateY }],
        }}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

export function Fab({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { anyOpen } = useContext(SheetCountContext);
  // Hide while any drawer is open so the FAB's shadow doesn't bleed through the
  // backdrop or ride up with the slide-in animation.
  if (anyOpen) {
    return null;
  }

  const isAndroid = Platform.OS === "android";
  // The native tab bar sits below the FAB. On Android the screen content is
  // already inset above the M3 navigation bar, so the M3 spec's 16dp margin
  // clears it. On iOS the screen extends *behind* the translucent / Liquid
  // Glass tab bar and the root safe-area inset reports only the home-indicator
  // gap, so add a standard tab-bar height (~49pt) on top to clear it. Tune this
  // single constant on-device if the iOS 26 glass bar's height differs.
  const bottom = isAndroid ? 16 : insets.bottom + 49 + 16;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: t.onPrimaryContainer, borderless: false }}
      style={({ pressed }) => ({
        position: "absolute",
        right: 16,
        bottom,
        width: 56,
        height: 56,
        // M3 FABs are 16dp rounded squares; iOS keeps the familiar circle.
        borderRadius: isAndroid ? 16 : 28,
        alignItems: "center",
        justifyContent: "center",
        // M3 uses the primary-container tonal color; iOS the solid primary.
        backgroundColor: isAndroid ? t.primaryContainer : t.primary,
        // Ripple covers Android press feedback; opacity handles iOS.
        opacity: !isAndroid && pressed ? 0.85 : 1,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
      })}
    >
      <Plus color={isAndroid ? t.onPrimaryContainer : t.onPrimary} size={24} />
    </Pressable>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }}>{children}</View>;
}

export function Center({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {children}
    </View>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <Center>
      <ActivityIndicator color={t.primary} size="large" />
    </Center>
  );
}

export function Txt({
  muted,
  size = 16,
  weight = "400",
  strike,
  style,
  ...rest
}: TextProps & {
  muted?: boolean;
  size?: number;
  weight?: "400" | "700";
  strike?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: FONT,
          fontSize: size,
          fontWeight: weight,
          color: muted ? t.muted : t.text,
          textDecorationLine: strike ? "line-through" : "none",
        },
        style,
      ]}
    />
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: variant === "primary" ? t.primary : "transparent",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: FONT,
          fontWeight: "700",
          fontSize: 16,
          textAlign: "center",
          color: variant === "primary" ? t.onPrimary : t.primary,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// Standard edge inset for header-bar actions. A custom headerLeft/headerRight
// doesn't inherit the native header's inset, so each one applies it itself.
export const HEADER_BUTTON_INSET = 16;

export function Field({ style, ...props }: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[
        styles.field,
        {
          backgroundColor: t.inputBg,
          borderColor: t.border,
          color: t.text,
          fontFamily: FONT,
        },
        style,
      ]}
    />
  );
}

export function Card({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  const t = useTheme();
  const inner = (
    <View
      style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
    >
      {children}
    </View>
  );
  if (!onPress) {
    return inner;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
});
