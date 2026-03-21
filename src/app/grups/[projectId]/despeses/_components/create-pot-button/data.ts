import * as v from "valibot";

export const potSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("El nom no pot estar buit"), v.trim()),
  memberIds: v.pipe(
    v.array(v.string()),
    v.minLength(2, "Cal seleccionar almenys 2 membres"),
  ),
});
