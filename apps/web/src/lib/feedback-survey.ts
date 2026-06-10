// Identifiers for the PostHog "In-app feedback" survey (API display type) in the
// EU project 28027. Responses are captured client-side via a `survey sent` event and
// surface in PostHog under Surveys → Results.
//
// These are not secrets, so they live as constants rather than env vars. They are
// populated from the survey created via PostHog MCP — see Surveys in the project.
export const FEEDBACK_SURVEY_ID = "019e7900-5ce9-0000-c7f7-61086f6fea3f";
export const FEEDBACK_QUESTION_TYPE_ID = "a21d9c3a-8c5d-4eb1-a161-541718a9a114";
export const FEEDBACK_QUESTION_SECTION_ID =
  "57a65962-db90-42d2-baa8-2ede9ef01cab";
export const FEEDBACK_QUESTION_MESSAGE_ID =
  "76735520-db31-4a40-a615-deae7390f75a";

export const FEEDBACK_TYPE_LABELS = {
  bug: "Bug",
  suggestion: "Suggestion",
} as const;

export type FeedbackType = keyof typeof FEEDBACK_TYPE_LABELS;

// Canonical (English) labels sent to PostHog, regardless of the UI locale, so the
// survey's single-choice question matches its configured choices. The keys mirror the
// app's section identifiers (see use-menu-items.tsx); `other` is the catch-all.
export const FEEDBACK_SECTION_LABELS = {
  lists: "Lists",
  calendar: "Calendar",
  files: "Files",
  notes: "Notes",
  expenses: "Expenses",
  secretSanta: "Secret Santa",
  other: "Other",
} as const;

export type FeedbackSection = keyof typeof FEEDBACK_SECTION_LABELS;
