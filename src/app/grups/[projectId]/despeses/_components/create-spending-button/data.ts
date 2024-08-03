import * as v from "valibot";

export const spendingSchema = v.pipe(
  v.object({
    amount: v.pipe(
      v.union([v.number(), v.string()]),
      v.transform((input) =>
        typeof input === "string" ? parseFloat(input) : input,
      ),
      v.number(),
      v.minValue(0.01),
    ),
    from: v.string(),
    to: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
  v.forward(
    v.partialCheck(
      [["from"], ["to"]],
      (input) => input.from !== input.to,
      "El pagador i el destinatari no poden ser la mateixa persona",
    ),
    ["to"],
  ),
);
