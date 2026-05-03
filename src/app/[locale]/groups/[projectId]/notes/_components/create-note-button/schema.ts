import * as v from "valibot";

export const noteSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  contents: v.string(),
  format: v.optional(v.string(), "html"),
});
