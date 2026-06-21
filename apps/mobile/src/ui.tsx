import { type LucideIcon, Plus } from "lucide-react-native";
import {
  createContext,
  type ReactNode,
  type Ref,
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
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
} from "react-native";
import { AnimatedFAB } from "react-native-paper";
import Reanimated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
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
    const onHide = Keyboard.addListener(hideEvt, (e) =>
      animateTo(0, e.duration),
    );
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

// Ignore sub-threshold scroll deltas so momentum jitter and overscroll bounce
// don't make the FAB flicker between its extended and collapsed forms.
const FAB_SCROLL_THRESHOLD = 8;

/**
 * Drives the M3 extended-FAB collapse from a screen's scroll position: attach
 * `onScroll` to the screen's ScrollView/FlatList and pass `extended` to `Fab`.
 * Extended at the top; collapses to the icon-only FAB on scroll down and
 * re-extends on scroll up (the Material You behavior, per Gmail et al.).
 */
export function useFabScroll(): {
  extended: boolean;
  onScroll: ((e: NativeSyntheticEvent<NativeScrollEvent>) => void) | undefined;
} {
  const [extended, setExtended] = useState(true);
  const lastOffset = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.y;
    const delta = offset - lastOffset.current;
    lastOffset.current = offset;
    if (offset <= 0) {
      setExtended(true);
      return;
    }
    if (Math.abs(delta) < FAB_SCROLL_THRESHOLD) {
      return;
    }
    setExtended(delta < 0);
  }, []);

  // The FAB only exists on Android (iOS creates from the header), so skip the
  // scroll subscription entirely elsewhere.
  if (Platform.OS !== "android") {
    return { extended: true, onScroll: undefined };
  }
  return { extended, onScroll };
}

// Material 3 floating action button — Android only. On iOS the create action
// lives in the navigation bar instead (a Liquid Glass "+" header item, wired
// via `sectionHeaderBadges` / `headerCreateAction`), so the FAB renders
// nothing there; a floating button isn't part of the iOS design language.
// Paper's AnimatedFAB implements the M3 extended↔collapsed morph; wire
// `extended` from `useFabScroll` so it collapses to the icon as the list
// scrolls. Colors and typeface come from our palette, not Paper's theme.
export function Fab({
  onPress,
  label,
  extended = true,
}: {
  onPress: () => void;
  label: string;
  extended?: boolean;
}) {
  const t = useTheme();
  const { anyOpen } = useContext(SheetCountContext);
  // Hide on iOS (header "+" instead), and while any drawer is open so the FAB's
  // shadow doesn't bleed through the backdrop or ride up with the slide-in.
  if (Platform.OS !== "android" || anyOpen) {
    return null;
  }

  return (
    <AnimatedFAB
      icon={({ size, color }) => <Plus color={color} size={size} />}
      label={label}
      extended={extended}
      onPress={onPress}
      color={t.onPrimary}
      animateFrom="right"
      // Paper reads the label font from its own theme; override just that slot
      // so the FAB matches the app typeface without a global PaperProvider.
      theme={{ fonts: { labelLarge: { fontFamily: FONT, fontWeight: "700" } } }}
      style={{
        position: "absolute",
        right: 16,
        // Screen content is already inset above the M3 navigation bar, so the
        // spec's 16dp margin clears it.
        bottom: 16,
        backgroundColor: t.primary,
      }}
    />
  );
}

export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }}>{children}</View>;
}

// Screen for full-screen forms: lifts content above the soft keyboard and wraps
// it in a ScrollView so the action button stays reachable and taps land while
// the keyboard is up (`keyboardShouldPersistTaps`). The lift is driven by
// Reanimated's `useAnimatedKeyboard`, which tracks the keyboard height on the UI
// thread on both platforms — crucially including Android edge-to-edge, where the
// window no longer resizes, so `KeyboardAvoidingView`/`adjustResize` does nothing
// and content stays pinned under the keyboard. Padding (not translate) shrinks
// the ScrollView so centered content re-centers above the keyboard and taller
// content scrolls instead of being clipped. `center` vertically centers the
// content when the keyboard is down.
export function KeyboardAwareScreen({
  children,
  center,
}: {
  children: ReactNode;
  center?: boolean;
}) {
  const t = useTheme();
  // The app is edge-to-edge (the RN 0.85 default), so the system bars are
  // translucent; tell Reanimated as much or it measures the keyboard height
  // against the wrong baseline on Android and under-lifts by the nav-bar inset.
  const keyboard = useAnimatedKeyboard({
    isStatusBarTranslucentAndroid: true,
    isNavigationBarTranslucentAndroid: true,
  });
  const liftStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));
  return (
    <Reanimated.View style={[{ flex: 1, backgroundColor: t.bg }, liftStyle]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          ...(center ? { justifyContent: "center" } : null),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Reanimated.View>
  );
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
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const t = useTheme();
  const textColor =
    variant === "primary"
      ? t.onPrimary
      : variant === "danger"
        ? t.danger
        : t.primary;
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
          color: textColor,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// Equal-width row container for a sheet's secondary-action toolbar. Wrap a set
// of `IconAction`s so they share spacing and stretch to a common height.
export function IconActionBar({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 8 }}>{children}</View>;
}

// Square action button for an `IconActionBar`: an icon over a caption, so the
// glyph isn't the only cue. `label` drives accessibility; `active` fills the
// glyph (e.g. a favorite star); `destructive` tints icon, caption, and border.
export function IconAction({
  icon: Icon,
  caption,
  label,
  onPress,
  active,
  destructive,
}: {
  icon: LucideIcon;
  caption: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
}) {
  const t = useTheme();
  const color = destructive ? t.danger : active ? t.primary : t.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: destructive ? t.danger : t.border,
        backgroundColor: t.inputBg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon color={color} size={20} fill={active ? color : "none"} />
      <Txt size={11} numberOfLines={1} style={{ color, textAlign: "center" }}>
        {caption}
      </Txt>
    </Pressable>
  );
}

export type SegmentedOption = {
  key: string;
  label: string;
  icon?: LucideIcon;
  active: boolean;
  onPress: () => void;
};

// Equal-width segmented control for mutually exclusive choices (e.g. the theme
// and language pickers in preferences).
export function Segmented({ options }: { options: SegmentedOption[] }) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { borderColor: t.border }]}>
      {options.map((option, index) => {
        const Icon = option.icon;
        return (
          <Pressable
            key={option.key}
            onPress={option.onPress}
            style={[
              styles.segment,
              {
                backgroundColor: option.active ? t.primary : "transparent",
                borderLeftWidth: index === 0 ? 0 : 1,
                borderLeftColor: t.border,
              },
            ]}
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

// Labelled form block: bold label above the control, optional italic hint below.
export function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
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

// Standard edge inset for header-bar actions. A custom headerLeft/headerRight
// doesn't inherit the native header's inset, so each one applies it itself.
export const HEADER_BUTTON_INSET = 16;

// RN's TextInputProps predates React 19's ref-as-prop, so accept it explicitly
// for hosts that need to refocus the input imperatively.
export function Field({
  style,
  ...props
}: TextInputProps & { ref?: Ref<TextInput> }) {
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
  muted = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  // Recede the card into a tonal surface (e.g. settled expense pots).
  muted?: boolean;
}) {
  const t = useTheme();
  const inner = (
    <View
      style={[
        styles.card,
        { backgroundColor: muted ? t.navBar : t.card, borderColor: t.border },
      ]}
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
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
});
