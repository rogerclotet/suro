import Constants from "expo-constants";
import { useSegments } from "expo-router";
import { Check } from "lucide-react-native";
import { usePostHog } from "posthog-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslations } from "@/i18n";
import {
  FEEDBACK_QUESTION_MESSAGE_ID,
  FEEDBACK_QUESTION_SECTION_ID,
  FEEDBACK_QUESTION_TYPE_ID,
  FEEDBACK_SECTION_LABELS,
  FEEDBACK_SECTIONS,
  FEEDBACK_SURVEY_ID,
  FEEDBACK_TYPE_LABELS,
  type FeedbackSection,
  type FeedbackType,
} from "@/lib/feedback-survey";
import { useTheme } from "@/theme";
import { Button, Field, Section, Segmented, Sheet, Txt } from "@/ui";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const MAX_MESSAGE_LENGTH = 1000;

function reportFeedbackError(
  posthog: ReturnType<typeof usePostHog> | undefined,
  error: unknown,
) {
  console.error("[feedback] submit failed:", error);
  if (!POSTHOG_KEY || !posthog) {
    return;
  }
  posthog.captureException(error, { action: "submit_feedback" });
  posthog.captureLog({
    body: `feedback submit failed: ${error instanceof Error ? error.message : String(error)}`,
    level: "error",
    attributes: { action: "submit_feedback" },
  });
  void posthog.flush();
}

/**
 * In-app feedback drawer. Submits to the same PostHog survey as the web app's
 * feedback dialog via a `survey sent` event with matching question ids.
 */
export function FeedbackSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!POSTHOG_KEY) {
    return <FeedbackSheetForm visible={visible} onClose={onClose} />;
  }
  return <FeedbackSheetWithPostHog visible={visible} onClose={onClose} />;
}

function FeedbackSheetWithPostHog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const posthog = usePostHog();
  return (
    <FeedbackSheetForm visible={visible} onClose={onClose} posthog={posthog} />
  );
}

function FeedbackSheetForm({
  visible,
  onClose,
  posthog,
}: {
  visible: boolean;
  onClose: () => void;
  posthog?: ReturnType<typeof usePostHog>;
}) {
  const t = useTheme();
  const tf = useTranslations("feedback");
  const tNav = useTranslations("nav");
  const segments = useSegments();

  const [type, setType] = useState<FeedbackType>("suggestion");
  const [section, setSection] = useState<FeedbackSection>("other");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setType("suggestion");
    setSection("other");
    setMessage("");
    setSubmitting(false);
    if (POSTHOG_KEY && posthog) {
      posthog.capture("survey shown", {
        $survey_id: FEEDBACK_SURVEY_ID,
      });
    }
  }, [visible, posthog]);

  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0 && !submitting;

  async function submit() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      if (POSTHOG_KEY && posthog) {
        posthog.capture("survey sent", {
          $survey_id: FEEDBACK_SURVEY_ID,
          $survey_questions: [
            FEEDBACK_QUESTION_TYPE_ID,
            FEEDBACK_QUESTION_SECTION_ID,
            FEEDBACK_QUESTION_MESSAGE_ID,
          ],
          [`$survey_response_${FEEDBACK_QUESTION_TYPE_ID}`]:
            FEEDBACK_TYPE_LABELS[type],
          [`$survey_response_${FEEDBACK_QUESTION_SECTION_ID}`]:
            FEEDBACK_SECTION_LABELS[section],
          [`$survey_response_${FEEDBACK_QUESTION_MESSAGE_ID}`]: trimmedMessage,
          feedback_path: segments.join("/") || "index",
          feedback_app_version: Constants.expoConfig?.version ?? "unknown",
        });
        await posthog.flush();
      }
      onClose();
      Alert.alert(tf("success"));
    } catch (e) {
      reportFeedbackError(posthog, e);
      Alert.alert(tf("error"));
    } finally {
      setSubmitting(false);
    }
  }

  function sectionLabel(key: FeedbackSection) {
    return key === "other" ? tf("sectionOther") : tNav(key);
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tf("title")}
      </Txt>
      <Txt muted size={14} style={{ lineHeight: 20 }}>
        {tf("description")}
      </Txt>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, paddingBottom: 8 }}
      >
        <Section label={tf("typeLabel")}>
          <Segmented
            options={(Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[]).map(
              (value) => ({
                key: value,
                label: value === "bug" ? tf("typeBug") : tf("typeSuggestion"),
                active: type === value,
                onPress: () => setType(value),
              }),
            )}
          />
        </Section>

        <Section label={tf("sectionLabel")}>
          <View
            style={[
              styles.sectionList,
              { borderColor: t.border, backgroundColor: t.inputBg },
            ]}
          >
            {FEEDBACK_SECTIONS.map((key, index) => {
              const selected = section === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSection(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.sectionRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderColor: t.border,
                    },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Txt
                    size={15}
                    weight={selected ? "700" : "400"}
                    style={{ flex: 1, color: selected ? t.primary : t.text }}
                  >
                    {sectionLabel(key)}
                  </Txt>
                  {selected ? <Check color={t.primary} size={18} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section label={tf("messageLabel")}>
          <Field
            value={message}
            onChangeText={setMessage}
            placeholder={tf("messagePlaceholder")}
            multiline
            numberOfLines={5}
            maxLength={MAX_MESSAGE_LENGTH}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />
        </Section>

        <Button
          title={submitting ? tf("submit") : tf("submit")}
          onPress={() => void submit()}
          disabled={!canSubmit}
        />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sectionList: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
});
