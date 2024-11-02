import * as v from "valibot";

export const noteSchema = v.object({
  name: v.string(),
  contents: v.string(),
  format: v.optional(v.string(), "plaintext"),
});
