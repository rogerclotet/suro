import * as v from "valibot";

export const profileSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  avatarColor: v.optional(v.nullable(v.string())),
});
