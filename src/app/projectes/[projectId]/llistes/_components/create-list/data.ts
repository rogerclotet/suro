import * as v from "valibot";

export const createListSchema = v.object({
  name: v.string(),
});
