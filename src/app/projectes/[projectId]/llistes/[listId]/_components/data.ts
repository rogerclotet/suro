import * as v from "valibot";

export const listItemSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  details: v.optional(v.pipe(v.string(), v.trim())),
  completed: v.boolean(),
});
