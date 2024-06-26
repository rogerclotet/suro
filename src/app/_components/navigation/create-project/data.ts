import * as v from "valibot";

export const createProjectSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
});
