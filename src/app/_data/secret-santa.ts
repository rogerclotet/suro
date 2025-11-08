import * as v from "valibot";
import type { getCurrentSecretSanta } from "@/server/secret-santa";

export const exclusionsSchema = v.array(
  v.pipe(
    v.object({
      from: v.string(),
      to: v.string(),
    }),
    v.forward(
      v.partialCheck(
        [["from"], ["to"]],
        (input) => input.from !== input.to,
        "El pagador i el destinatari no poden ser la mateixa persona",
      ),
      ["to"],
    ),
  ),
);

export type ExclusionsData = v.InferOutput<typeof exclusionsSchema>;

export const priceRangeSchema = v.pipe(
  v.object({
    min: v.pipe(
      v.number(),
      v.integer("No es poden introduir decimals"),
      v.minValue(0, "No es poden introduir preus negatius"),
    ),
    max: v.pipe(
      v.number(),
      v.integer("No es poden introduir decimals"),
      v.minValue(0, "No es poden introduir preus negatius"),
    ),
  }),
  v.forward(
    v.partialCheck(
      [["min"], ["max"]],
      (input) => input.min <= input.max,
      "El preu mínim no pot ser superior al preu màxim",
    ),
    ["max"],
  ),
);

export type PriceRangeData = v.InferOutput<typeof priceRangeSchema>;

export const secretSantaSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("No pot estar buit")),
  description: v.optional(v.pipe(v.string(), v.trim())),
  priceRange: priceRangeSchema,
  datetime: v.pipe(
    v.date(),
    v.minValue(
      new Date(),
      "La data i hora no poden ser anteriors a la data actual",
    ),
  ),
  participants: v.pipe(
    v.array(v.string()),
    v.minLength(2, "Es necessiten com a mínim 2 participants"),
  ),
  exclusions: v.optional(exclusionsSchema),
});

export type SecretSantaData = v.InferOutput<typeof secretSantaSchema>;

export const giftIdeaSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("No pot estar buit")),
  description: v.optional(v.string()),
  url: v.optional(v.pipe(v.string(), v.trim(), v.url("No és una URL vàlida"))),
});

export type GiftIdeaData = v.InferOutput<typeof giftIdeaSchema>;

export type SecretSanta = NonNullable<
  Awaited<ReturnType<typeof getCurrentSecretSanta>>
>;
