import * as v from "valibot";

export const templateSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  description: v.pipe(v.string(), v.trim()),
  items: v.array(
    v.object({
      name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
      category: v.string(),
    }),
  ),
});
