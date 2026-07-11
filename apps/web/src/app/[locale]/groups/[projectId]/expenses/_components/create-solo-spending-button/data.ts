import * as v from "valibot";

export const soloSpendingSchema = v.object({
  amount: v.pipe(
    v.union([v.number(), v.string()]),
    v.transform((input) =>
      typeof input === "string" ? parseFloat(input) : input,
    ),
    v.number(),
    v.minValue(0.01),
  ),
  description: v.optional(v.string()),
});
