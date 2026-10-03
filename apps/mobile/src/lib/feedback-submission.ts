import type { PostHog } from "posthog-react-native";
import { captureException, flushErrors } from "@/lib/error-reporting";
import {
  FEEDBACK_QUESTION_MESSAGE_ID,
  FEEDBACK_QUESTION_SECTION_ID,
  FEEDBACK_QUESTION_TYPE_ID,
  FEEDBACK_SECTION_LABELS,
  FEEDBACK_SURVEY_ID,
  FEEDBACK_TYPE_LABELS,
  type FeedbackSection,
  type FeedbackType,
} from "@/lib/feedback-survey";

type FeedbackClient = Pick<PostHog, "capture" | "flush" | "ready" | "optedOut">;

type FeedbackInput = {
  type: FeedbackType;
  section: FeedbackSection;
  message: string;
  path: string;
  appVersion: string;
};

export async function submitFeedback(
  posthog: FeedbackClient | undefined,
  input: FeedbackInput,
) {
  if (!posthog) {
    throw new Error(
      "Feedback cannot be sent: PostHog is not configured. Set EXPO_PUBLIC_POSTHOG_KEY and rebuild the app.",
    );
  }
  await posthog.ready();
  if (posthog.optedOut) {
    throw new Error("Feedback cannot be sent: PostHog tracking is disabled.");
  }

  posthog.capture("survey sent", {
    $survey_id: FEEDBACK_SURVEY_ID,
    $survey_completed: true,
    $survey_questions: [
      {
        id: FEEDBACK_QUESTION_TYPE_ID,
        question: "What kind of feedback is this?",
      },
      {
        id: FEEDBACK_QUESTION_SECTION_ID,
        question: "Which part of the app is this about?",
      },
      { id: FEEDBACK_QUESTION_MESSAGE_ID, question: "Tell us more" },
    ],
    [`$survey_response_${FEEDBACK_QUESTION_TYPE_ID}`]:
      FEEDBACK_TYPE_LABELS[input.type],
    [`$survey_response_${FEEDBACK_QUESTION_SECTION_ID}`]:
      FEEDBACK_SECTION_LABELS[input.section],
    [`$survey_response_${FEEDBACK_QUESTION_MESSAGE_ID}`]: input.message,
    feedback_path: input.path,
    feedback_app_version: input.appVersion,
  });
  // Await delivery so the form only reports success after the SDK sends the queue.
  await posthog.flush();
}

export async function reportFeedbackError(error: unknown) {
  console.error("[feedback] submit failed:", error);
  try {
    captureException(error, { action: "submit_feedback" });
    await flushErrors();
  } catch (reportingError) {
    console.error("[feedback] error reporting failed:", reportingError);
  }
}
