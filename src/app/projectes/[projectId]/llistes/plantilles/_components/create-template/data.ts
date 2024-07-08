import * as v from "valibot";

export const templateItemSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  category: v.string(),
});

export const templateSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  description: v.pipe(v.string(), v.trim()),
  items: v.array(templateItemSchema),
});
