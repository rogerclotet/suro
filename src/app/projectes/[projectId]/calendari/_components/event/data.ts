import * as v from "valibot";

export const eventSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  description: v.pipe(v.string(), v.trim()),
  dates: v.object({
    from: v.optional(v.date()),
    to: v.optional(v.date()),
  }),
  allDay: v.boolean(),
});
