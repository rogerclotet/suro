import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import {
  Calendar,
  FolderOpen,
  HandCoins,
  Home,
  ListTodo,
  type LucideIcon,
  Sparkles,
} from "lucide-react-native";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView as RNGestureHandlerRootView,
} from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { useTranslations } from "@/i18n";
import {
  CATPPUCCIN_COLOR_KEYS,
  CATPPUCCIN_COLORS,
  type CatppuccinColor,
} from "@/lib/catppuccin-colors";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";
import { useTheme } from "@/theme";
import { Button, Field, Txt } from "@/ui";
import { Avatar } from "./avatar";

// The feature tour, in the order the mobile bottom bar presents the sections:
// a content-first Home, the high-traffic sections, then the "More" tab that
// holds files and notes. `key` is both the i18n suffix and the step identity.
// Ported from the web walkthrough (`onboarding-walkthrough.tsx`), with the two
// mobile-only sections — Home and More — added.
const FEATURE_STEPS = [
  { key: "home", icon: Home },
  { key: "lists", icon: ListTodo },
  { key: "calendar", icon: Calendar },
  { key: "expenses", icon: HandCoins },
  { key: "more", icon: FolderOpen },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

// Welcome + one per feature + the closing profile step.
const TOTAL_STEPS = FEATURE_STEPS.length + 2;
const PROFILE_STEP = TOTAL_STEPS - 1;

// A swipe commits to the next/previous step past either of these — distance in
// points or fling velocity in points/second — so a short flick advances too.
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

// RN's Modal mounts a new native view root that the app-level
// GestureHandlerRootView doesn't cover, so gestures inside it need their own.
// Re-typed for `children` like the root layout does (React 19 prop types drop
// it); runtime behavior is unchanged.
const GestureRoot = RNGestureHandlerRootView as unknown as ComponentType<{
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}>;

/**
 * First-run walkthrough, mirroring the web onboarding: a non-dismissible modal
 * shown once to brand-new users (the server sets `onboardingCompleted: false`
 * at sign-up). Gates on `api.users.me` and flips the flag via
 * `completeOnboarding` on finish or skip. Mounted once at the app root so it
 * floats over whichever screen the launch redirect lands on.
 */
export function Onboarding() {
  const { isAuthenticated } = useAuthGate();
  const me = usePersistentQuery(api.users.me, isAuthenticated ? {} : "skip");
  // Hide instantly on completion so the modal doesn't linger while the `me`
  // query round-trips the flipped flag (mirrors the web's `onboardingSkipped`).
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !me || me.onboardingCompleted !== false) {
    return null;
  }

  return (
    <Walkthrough
      initialName={me.name ?? ""}
      initialColor={(me.avatarColor as CatppuccinColor | undefined) ?? null}
      image={me.customImage ?? me.image ?? null}
      onDone={() => setDismissed(true)}
    />
  );
}

function Walkthrough({
  initialName,
  initialColor,
  image,
  onDone,
}: {
  initialName: string;
  initialColor: CatppuccinColor | null;
  image: string | null;
  onDone: () => void;
}) {
  const t = useTheme();
  const tr = useTranslations("mobile.onboarding");
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<CatppuccinColor | null>(initialColor);
  const [submitting, setSubmitting] = useState(false);

  const isFirst = step === 0;
  const isLast = step === PROFILE_STEP;

  // Which way the next render should slide its content in. A ref (not state) so
  // setting it doesn't trigger an extra render before the step change does.
  const direction = useRef<"next" | "back">("next");
  const goNext = useCallback(() => {
    direction.current = "next";
    setStep((s) => Math.min(s + 1, PROFILE_STEP));
  }, []);
  const goBack = useCallback(() => {
    direction.current = "back";
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // Horizontal swipe to move between slides. `activeOffsetX` makes it claim only
  // clearly-horizontal drags and `failOffsetY` yields to the vertical ScrollView,
  // so a tall profile step still scrolls. The end-step guards in goNext/goBack
  // make an over-swipe at either end a no-op (a left swipe never submits).
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-14, 14])
        .onEnd((e) => {
          if (
            e.translationX <= -SWIPE_DISTANCE ||
            e.velocityX <= -SWIPE_VELOCITY
          ) {
            runOnJS(goNext)();
          } else if (
            e.translationX >= SWIPE_DISTANCE ||
            e.velocityX >= SWIPE_VELOCITY
          ) {
            runOnJS(goBack)();
          }
        }),
    [goNext, goBack],
  );

  let content: ReactNode;
  if (isFirst) {
    content = (
      <StepBody
        icon={Sparkles}
        title={tr("welcomeTitle")}
        body={tr("welcomeBody")}
      />
    );
  } else if (isLast) {
    content = (
      <ProfileStep
        name={name}
        onNameChange={setName}
        color={color}
        onColorChange={setColor}
        image={image}
        title={tr("profileTitle")}
        body={tr("profileBody")}
        namePlaceholder={tr("profileNamePlaceholder")}
      />
    );
  } else {
    content = <FeatureStep step={step} tr={tr} />;
  }

  async function finish() {
    setSubmitting(true);
    try {
      const trimmed = name.trim();
      // Server-side `completeOnboarding` records `onboarding_completed`.
      await completeOnboarding({
        name: trimmed || undefined,
        avatarColor: color,
      });
      onDone();
    } catch {
      setSubmitting(false);
    }
  }

  async function skip() {
    setSubmitting(true);
    try {
      await completeOnboarding({});
      onDone();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <GestureRoot style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "88%",
              backgroundColor: t.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: t.border,
              // Clip the off-screen slide-in so it doesn't bleed past the card.
              overflow: "hidden",
              padding: 24,
              gap: 20,
            }}
          >
            <GestureDetector gesture={swipe}>
              <ScrollView
                contentContainerStyle={{ gap: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <Reanimated.View
                  // Remount on each step so the entering animation replays,
                  // sliding in from the side the swipe/tap moved toward.
                  key={step}
                  entering={(direction.current === "next"
                    ? SlideInRight
                    : SlideInLeft
                  ).duration(220)}
                  style={{ gap: 16 }}
                >
                  {content}
                </Reanimated.View>
              </ScrollView>
            </GestureDetector>

            <View style={{ gap: 12 }}>
              <Dots step={step} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, opacity: isFirst ? 0 : 1 }}>
                  <Button
                    title={tr("back")}
                    variant="ghost"
                    onPress={goBack}
                    disabled={submitting || isFirst}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  {isLast ? (
                    <Button
                      title={tr("letsGo")}
                      onPress={() => void finish()}
                      disabled={submitting}
                    />
                  ) : (
                    <Button
                      title={tr("next")}
                      onPress={goNext}
                      disabled={submitting}
                    />
                  )}
                </View>
              </View>
              {isLast ? null : (
                <Button
                  title={tr("skip")}
                  variant="ghost"
                  onPress={() => void skip()}
                  disabled={submitting}
                />
              )}
            </View>
          </View>
        </View>
      </GestureRoot>
    </Modal>
  );
}

function FeatureStep({
  step,
  tr,
}: {
  step: number;
  tr: ReturnType<typeof useTranslations>;
}) {
  // Steps 1..N map onto the feature list (step 0 is welcome).
  const feature = FEATURE_STEPS[step - 1];
  if (!feature) {
    return null;
  }
  return (
    <StepBody
      icon={feature.icon}
      title={tr(`${feature.key}Title`)}
      body={tr(`${feature.key}Body`)}
    />
  );
}

function StepBody({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 16, paddingVertical: 8 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${t.primary}1a`,
        }}
      >
        <Icon color={t.primary} size={32} />
      </View>
      <View style={{ gap: 8 }}>
        <Txt size={22} weight="700" style={{ textAlign: "center" }}>
          {title}
        </Txt>
        <Txt muted style={{ textAlign: "center", lineHeight: 22 }}>
          {body}
        </Txt>
      </View>
    </View>
  );
}

function ProfileStep({
  name,
  onNameChange,
  color,
  onColorChange,
  image,
  title,
  body,
  namePlaceholder,
}: {
  name: string;
  onNameChange: (value: string) => void;
  color: CatppuccinColor | null;
  onColorChange: (value: CatppuccinColor) => void;
  image: string | null;
  title: string;
  body: string;
  namePlaceholder: string;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 16, paddingVertical: 8 }}>
      <Avatar name={name} image={image} color={color} size={72} />
      <View style={{ gap: 8 }}>
        <Txt size={22} weight="700" style={{ textAlign: "center" }}>
          {title}
        </Txt>
        <Txt muted style={{ textAlign: "center", lineHeight: 22 }}>
          {body}
        </Txt>
      </View>
      <Field
        value={name}
        onChangeText={onNameChange}
        placeholder={namePlaceholder}
        autoCapitalize="words"
        style={{ alignSelf: "stretch" }}
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        {CATPPUCCIN_COLOR_KEYS.map((key) => {
          const swatch = CATPPUCCIN_COLORS[key];
          const selected = color === key;
          return (
            <Pressable
              key={key}
              onPress={() => onColorChange(key)}
              accessibilityRole="button"
              accessibilityLabel={key}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: swatch.bg,
                borderWidth: selected ? 2 : 0,
                borderColor: t.text,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function Dots({ step }: { step: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length step rail
          key={i}
          style={{
            height: 6,
            width: i === step ? 24 : 6,
            borderRadius: 3,
            backgroundColor: i === step ? t.primary : `${t.muted}55`,
          }}
        />
      ))}
    </View>
  );
}
