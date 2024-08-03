import * as v from "valibot";

export const spendingSchema = v.object({
  amount: v.number(),
  from: v.string(),
  to: v.optional(v.string()),
});
