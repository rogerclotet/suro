import * as v from "valibot";

export const projectSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
});
