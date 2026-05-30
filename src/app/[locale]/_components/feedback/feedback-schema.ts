import * as v from "valibot";

export const feedbackSchema = v.object({
  type: v.picklist(["bug", "suggestion"]),
  message: v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(1000)),
});

export type FeedbackInput = v.InferInput<typeof feedbackSchema>;
