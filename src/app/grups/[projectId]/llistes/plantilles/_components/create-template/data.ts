import * as v from "valibot";

export const templateItemSchema = v.object({
  name: v.pipe(v.string(), v.trim()),
  category: v.nullable(v.string()),
});

export const templateSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty()),
  description: v.pipe(v.string(), v.trim()),
  items: v.array(templateItemSchema),
});
