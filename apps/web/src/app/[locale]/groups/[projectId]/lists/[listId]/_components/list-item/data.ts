import * as v from "valibot";

export const listItemSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("No pot estar buit")),
  details: v.optional(v.pipe(v.string(), v.trim())),
  completed: v.boolean(),
  category: v.nullable(v.string()),
});
