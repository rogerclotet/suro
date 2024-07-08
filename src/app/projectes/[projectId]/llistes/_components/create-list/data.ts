import * as v from "valibot";

export const listSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  description: v.pipe(v.string(), v.trim()),
  templates: v.optional(v.array(v.string())),
});
