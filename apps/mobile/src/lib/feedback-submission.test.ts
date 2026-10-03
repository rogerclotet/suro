import { afterEach, describe, expect, it, vi } from "vitest";
import { reportFeedbackError, submitFeedback } from "./feedback-submission";
import {
  FEEDBACK_QUESTION_MESSAGE_ID,
  FEEDBACK_SURVEY_ID,
} from "./feedback-survey";

const reporter = vi.hoisted(() => ({
  capture: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/error-reporting", () => ({
  captureException: reporter.capture,
  flushErrors: reporter.flush,
}));

const input = {
  type: "bug",
  section: "lists",
  message: "My feedback",
  path: "(app)/[projectId]/lists",
  appVersion: "1.23.1",
} as const;

function client() {
  return {
    capture: vi.fn(),
    ready: vi.fn().mockResolvedValue(undefined),
    flush: vi.fn().mockResolvedValue(undefined),
    optedOut: false,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("feedback submission", () => {
  it("rejects instead of claiming success without a configured client", async () => {
    await expect(submitFeedback(undefined, input)).rejects.toThrow(
      /configured/,
    );
  });

  it("rejects when tracking is opted out instead of silently dropping feedback", async () => {
    const posthog = client();
    posthog.optedOut = true;
    await expect(submitFeedback(posthog, input)).rejects.toThrow(/disabled/);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("sends a completed response with question metadata and waits for delivery", async () => {
    const posthog = client();
    let completeFlush = () => {};
    posthog.flush.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          completeFlush = resolve;
        }),
    );
    let submitted = false;
    const submission = submitFeedback(posthog, input).then(() => {
      submitted = true;
    });
    await vi.waitFor(() => expect(posthog.flush).toHaveBeenCalled());
    expect(submitted).toBe(false);
    expect(posthog.capture).toHaveBeenCalledWith(
      "survey sent",
      expect.objectContaining({
        $survey_id: FEEDBACK_SURVEY_ID,
        $survey_completed: true,
        $survey_questions: expect.arrayContaining([
          expect.objectContaining({
            id: FEEDBACK_QUESTION_MESSAGE_ID,
            question: expect.any(String),
          }),
        ]),
        [`$survey_response_${FEEDBACK_QUESTION_MESSAGE_ID}`]: input.message,
        feedback_path: input.path,
        feedback_app_version: input.appVersion,
      }),
    );
    completeFlush();
    await submission;
    expect(submitted).toBe(true);
  });

  it("propagates a failed send so the form can retain the draft and show an error", async () => {
    const posthog = client();
    posthog.flush.mockRejectedValue(new Error("Network unavailable"));
    await expect(submitFeedback(posthog, input)).rejects.toThrow(
      "Network unavailable",
    );
  });
});

describe("feedback error reporting", () => {
  it("reports without a PostHog client or feedback content", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Network unavailable");
    await reportFeedbackError(error);
    expect(reporter.capture).toHaveBeenCalledWith(error, {
      action: "submit_feedback",
    });
    expect(reporter.flush).toHaveBeenCalled();
  });

  it("contains delivery failures so the draft remains retryable", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    reporter.flush.mockRejectedValueOnce(new Error("Reporter offline"));
    await expect(
      reportFeedbackError(new Error("Send failed")),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ message: "Reporter offline" }),
    );
  });
});
