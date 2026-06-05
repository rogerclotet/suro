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
  Keyboard,
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
  onClosed,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  // Fires once the sheet has fully slid out and unmounted. Use it to chain a
  // second sheet open: presenting a new Modal while this one is still mounted
  // is silently dropped on iOS, so the next sheet must wait for this.
  onClosed?: () => void;
  children: ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { acquire, release } = useContext(SheetCountContext);
  const [mounted, setMounted] = useState(false);
  const anim = useMemo(() => new Animated.Value(0), []);
  // Lifts the panel above the keyboard. RN's Modal doesn't resize its own
  // window for the keyboard on Android, so without this the keyboard covers any
  // focused TextInput inside a drawer.
  const liftAnim = useMemo(() => new Animated.Value(0), []);
  // The panel's measured height, used to clamp the lift so a tall form's top
  // (where its text inputs live) is never pushed off the top of the screen.
  const panelHeight = useRef(0);
  const shownRef = useRef(false);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });

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
      shownRef.current = true;
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
          if (shownRef.current) {
            shownRef.current = false;
            onClosedRef.current?.();
          }
        }
      });
    }
  }, [visible, anim]);

  // iOS reports the keyboard before it animates in (smoother); Android only
  // fires the "did" events. Animate the panel up to keep the focused input
  // visible, but clamp the rise so a tall panel's top stays on screen.
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const animateTo = (value: number, duration: number) =>
      Animated.timing(liftAnim, {
        toValue: value,
        duration: duration > 0 ? duration : 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    const onShow = Keyboard.addListener(showEvt, (e) => {
      // Never lift so far that the panel's top crosses the safe-area inset.
      const headroom = Math.max(
        0,
        SCREEN_HEIGHT - panelHeight.current - insets.top,
      );
      animateTo(Math.min(e.endCoordinates.height, headroom), e.duration);
    });
    const onHide = Keyboard.addListener(hideEvt, (e) => animateTo(0, e.duration));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [liftAnim, insets.top]);

  if (!mounted) {
    return null;
  }

  // Backdrop fades opacity in place; only the panel translates up — so the
  // dark overlay no longer rides up with the drawer. A second translate lifts
  // the panel above the keyboard when it's open.
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });
  const keyboardLift = Animated.multiply(liftAnim, -1);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", opacity: anim }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        onLayout={(e) => {
          panelHeight.current = e.nativeEvent.layout.height;
        }}
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
          transform: [{ translateY }, { translateY: keyboardLift }],
        }}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

// Material 3 extended floating action button — Android only. On iOS the create
// action lives in the navigation bar instead (a Liquid Glass "+" header item,
// wired via `sectionHeaderBadges` / `headerCreateAction`), so the FAB renders
// nothing there; a floating button isn't part of the iOS design language.
// Mirrors the web app's FAB: a bright `primary` green pill with the action
// label beside the "+", rather than M3's tonal icon-only square.
export function Fab({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  const t = useTheme();
  const { anyOpen } = useContext(SheetCountContext);
  // Hide on iOS (header "+" instead), and while any drawer is open so the FAB's
  // shadow doesn't bleed through the backdrop or ride up with the slide-in.
  if (Platform.OS !== "android" || anyOpen) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: t.onPrimary, borderless: false }}
      style={{
        position: "absolute",
        right: 16,
        // Screen content is already inset above the M3 navigation bar, so the
        // spec's 16dp margin clears it.
        bottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 56,
        paddingHorizontal: 20, // M3 extended FAB padding.
        borderRadius: 16,
        backgroundColor: t.primary,
        elevation: 6,
      }}
    >
      <Plus color={t.onPrimary} size={24} />
      <Txt size={15} weight="700" style={{ color: t.onPrimary }}>
        {label}
      </Txt>
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

// Thin completion bar mirroring the web list preview: a muted track with a
// primary fill that's dimmed until everything is done.
export function ProgressBar({
  value,
  complete,
}: {
  value: number;
  complete?: boolean;
}) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={{
        height: 4,
        borderRadius: 999,
        backgroundColor: t.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 999,
          backgroundColor: t.primary,
          opacity: complete ? 1 : 0.5,
        }}
      />
    </View>
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
