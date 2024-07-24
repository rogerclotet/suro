import * as v from "valibot";

export const editFileSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty()),
});
